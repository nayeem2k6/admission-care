
export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly errors?: FieldError[];
  readonly isOperational = true;

  constructor(statusCode: number, message: string, errors?: FieldError[]) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message = "Bad request", errors?: FieldError[]): ApiError {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = "Authentication required"): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message = "You do not have permission to perform this action"): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message = "Resource not found"): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message = "Resource already exists"): ApiError {
    return new ApiError(409, message);
  }

  static tooManyRequests(message = "Too many requests. Please try again later."): ApiError {
    return new ApiError(429, message);
  }

  static internal(message = "Something went wrong. Please try again later."): ApiError {
    return new ApiError(500, message);
  }
}