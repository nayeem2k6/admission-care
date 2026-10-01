
import "dotenv/config";
import { z } from "zod";

const isValidUrl = (value: string): boolean => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const splitOrigins = (value: string): string[] =>
  value
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

const cloudinaryKeys = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(5000),
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long"),
    JWT_EXPIRES_IN: z.string().min(1).default("1d"),
    FRONTEND_URL: z
      .string()
      .min(1, "FRONTEND_URL is required")
      .refine(
        (value) => {
          const origins = splitOrigins(value);
          return origins.length > 0 && origins.every(isValidUrl);
        },
        "FRONTEND_URL must contain one or more valid URLs separated by commas",
      ),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(1),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV !== "production") return;
    for (const key of cloudinaryKeys) {
      if (!data[key]) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `${key} is required in production`,
        });
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.map(String).join(".")}: ${issue.message}`)
    .join("\n");
  console.error(`\nInvalid environment configuration:\n${details}\n`);
  process.exit(1);
}

const data = parsed.data;

export const env = {
  ...data,
  isProduction: data.NODE_ENV === "production",
  isDevelopment: data.NODE_ENV === "development",
  frontendOrigins: splitOrigins(data.FRONTEND_URL),
} as const;

export type Env = typeof env;