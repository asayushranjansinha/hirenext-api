import dotenv from "dotenv";
import path from "path";

// Load .env from the project root - you need to pass the path!
dotenv.config({ path: path.join(process.cwd(), ".env") });

import { z } from "zod";
const envSchema = z.object({
  PORT: z.coerce.number(),
  NODE_ENV: z.enum(["development", "production", "test"]),

  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_TLS: z.boolean().default(false),
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
};
export type EnvConfig = typeof envConfig;
