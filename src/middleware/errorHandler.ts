import type { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { env } from "../config/env";
import { ApiError, type FieldError } from "../utils/ApiError";

interface NormalizedError {
  statusCode: number;
  message: string;
  errors?: FieldError[];
}

const GENERIC_MESSAGE = "Something went wrong. Please try again later.";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const normalizeError = (err: unknown): NormalizedError => {
  if (err instanceof ApiError) {
    return { statusCode: err.statusCode, message: err.message, errors: err.errors };
  }

  if (err instanceof ZodError) {
    return {
      statusCode: 400,
      message: "Validation failed. Please check the highlighted fields.",
      errors: err.issues.map((issue) => ({
        field: issue.path.map(String).join("."),
        message: issue.message,
      })),
    };
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return {
      statusCode: 400,
      message: "Validation failed. Please check the highlighted fields.",
      errors: Object.values(err.errors).map((fieldError) => ({
        field: fieldError.path,
        message: fieldError.message,
      })),
    };
  }

  if (err instanceof mongoose.Error.CastError) {
    return {
      statusCode: 400,
      message: err.path === "_id" ? "Invalid ID format." : `Invalid value for "${err.path}".`,
    };
  }

  if (isRecord(err)) {
    // MongoDB duplicate key
    if (err.code === 11000) {
      const keyValue = isRecord(err.keyValue) ? err.keyValue : {};
      const field = Object.keys(keyValue)[0];
      return {
        statusCode: 409,
        message: field ? `A record with this ${field} already exists.` : "This record already exists.",
      };
    }

    // body-parser errors
    if (err.type === "entity.parse.failed") {
      return { statusCode: 400, message: "Invalid JSON in request body." };
    }
    if (err.type === "entity.too.large") {
      return { statusCode: 413, message: "Request body is too large." };
    }

    // multer errors (upload middleware arrives in a later phase)
    if (err.name === "MulterError") {
      if (err.code === "LIMIT_FILE_SIZE") {
        return { statusCode: 413, message: "The uploaded file is too large." };
      }
      return {
        statusCode: 400,
        message: typeof err.message === "string" ? err.message : "Invalid file upload.",
      };
    }

    // jsonwebtoken errors (auth arrives in a later phase)
    if (err.name === "TokenExpiredError") {
      return { statusCode: 401, message: "Your session has expired. Please log in again." };
    }
    if (err.name === "JsonWebTokenError" || err.name === "NotBeforeError") {
      return { statusCode: 401, message: "Invalid authentication token." };
    }
  }

  return {
    statusCode: 500,
    message: env.isProduction ? GENERIC_MESSAGE : err instanceof Error ? err.message : GENERIC_MESSAGE,
  };
};

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const { statusCode, message, errors } = normalizeError(err);

  if (statusCode >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && errors.length > 0 ? { errors } : {}),
    ...(!env.isProduction && statusCode >= 500 && err instanceof Error ? { stack: err.stack } : {}),
  });
};