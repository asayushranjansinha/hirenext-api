import dotenv from "dotenv";
import path from "path";

// Load .env from the project root - you need to pass the path!
dotenv.config({ path: path.join(process.cwd(), '.env') });

import { z } from "zod";
const envSchema = z.object({
  PORT: z.coerce.number(),
  NODE_ENV: z
    .enum(["development", "production", "test"]),
  FAKE_ENV_VAR: z.string(),
});

// Parse the environment variables
const env = envSchema.parse(process.env);

export const envConfig = {
  port: env.PORT,
  env: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === "development",
  isProduction: env.NODE_ENV === "production",
  isTest: env.NODE_ENV === "test",
  fakeEnvVar: env.FAKE_ENV_VAR,
};
export type EnvConfig = typeof envConfig;
