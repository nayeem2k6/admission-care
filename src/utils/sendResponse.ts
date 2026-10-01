import type { Response } from "express";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface SendSuccessOptions<T> {
  message: string;
  data?: T;
  statusCode?: number;
  meta?: PaginationMeta;
}

export const buildPaginationMeta = (total: number, page: number, limit: number): PaginationMeta => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

export const sendSuccess = <T>(
  res: Response,
  { message, data, statusCode = 200, meta }: SendSuccessOptions<T>,
): Response =>
  res.status(statusCode).json({
    success: true,
    message,
    data: data ?? null,
    ...(meta ? { meta } : {}),
  });