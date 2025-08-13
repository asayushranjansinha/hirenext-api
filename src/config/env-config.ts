import dotenv from "dotenv";
import path from "path";

// Load .env from the project root - you need to pass the path!
dotenv.config({ path: path.join(process.cwd(), ".env") });

import { z } from "zod";
const envSchema = z.object({
  // Server
  PORT: z.coerce.number(),
  NODE_ENV: z.enum(["development", "production", "test"]),

  // Redis
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_TLS: z.coerce.boolean().default(false),

  // OTP
  OTP_RATE_LIMIT: z.coerce.number().default(5),
  OTP_TTL_SECONDS: z.coerce.number().default(300),

  // JWT
  ENCRYPTION_KEY: z.string(),
  JWT_ACCESS_SECRET: z.string(),
  JWT_ACCESS_EXPIRES: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_REFRESH_EXPIRES: z.string(),
});

// Parse the environment variables
const env = envSchema.parse(process.env);

export const envConfig = {
  port: env.PORT,
  env: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === "development",
  isProduction: env.NODE_ENV === "production",
  isTest: env.NODE_ENV === "test",
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    tls: env.REDIS_TLS,
  },
  otp: {
    rateLimit: env.OTP_RATE_LIMIT,
    ttlSeconds: env.OTP_TTL_SECONDS,
  },
  encryptionKey: env.ENCRYPTION_KEY,
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    accessExpires: env.JWT_ACCESS_EXPIRES,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshExpires: env.JWT_REFRESH_EXPIRES,
  },
};
export type EnvConfig = typeof envConfig;
