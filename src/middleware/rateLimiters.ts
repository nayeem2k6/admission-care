import rateLimit from "express-rate-limit";
import { ApiError } from "../utils/ApiError";

interface LimiterOptions {
  windowMs: number;
  limit: number;
  message: string;
  skipSuccessfulRequests?: boolean;
}

export const createLimiter = ({ windowMs, limit, message, skipSuccessfulRequests = false }: LimiterOptions) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: (_req, _res, next) => next(ApiError.tooManyRequests(message)),
  });

/** Applied to every /api request. */
export const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: "Too many requests. Please try again in a few minutes.",
});

/** For admin login: failed attempts only. */
export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: "Too many login attempts. Please try again in 15 minutes.",
  skipSuccessfulRequests: true,
});

/** For public forms (admission, contact, testimonial submission). */
export const formLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: "You have submitted too many forms recently. Please try again later.",
});