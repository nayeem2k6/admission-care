
import type { CorsOptions } from "cors";
import { env } from "./env";
import { ApiError } from "../utils/ApiError";

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Requests without an Origin header (server-side fetches, curl, health checks) are allowed.
    if (!origin || env.frontendOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(ApiError.forbidden("This origin is not allowed to access the API."));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 60 * 60 * 24,
};