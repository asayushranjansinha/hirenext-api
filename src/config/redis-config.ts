import { type RedisOptions, Redis } from "ioredis";

import { envConfig } from "@/config/env-config.js";
import { logger } from "./logger-config.js";

const options: RedisOptions = {
  maxRetriesPerRequest: 2,
  lazyConnect: true,
};

options.host = envConfig.redis.host;
options.port = envConfig.redis.port;

if (envConfig.redis.password) {
  options.password = envConfig.redis.password;
}

// For Upstash, TLS is required in production and must be an object, not a boolean
if (envConfig.isProduction) {
  options.tls = { rejectUnauthorized: false }; // Disable cert verification if necessary (Upstash recommends this)
} else {
  delete options.tls;
}

export const createRedisClient = (): Redis => {
  const redis = new Redis(options);

  redis.on("error", (error) => {
    logger.error(`RedisClient: error → ${error.message}`, {
      stack: error.stack,
    });
  });

  redis.on("connect", () => {
    logger.info("RedisClient: connected");
  });

  redis.on("ready", () => {
    logger.info("RedisClient: ready to use");
  });

  redis.on("close", () => {
    logger.warn("RedisClient: connection closed");
  });

  redis.on("reconnecting", (time: number) => {
    logger.info(`RedisClient: reconnecting in ${time}ms`);
  });

  return redis;
};

export const redis = createRedisClient();
