import crypto from "crypto";

import { logger } from "@/config/logger-config.js";
import { redis } from "@/config/redis-config.js";

const TAG_PREFIX = "tag:";
const tagKey = (tag: string) => `${TAG_PREFIX}${tag}`;

/**
 * Creates a hashed Redis cache key from a prefix and dynamic parts.
 * @example
 * const key = createCacheKey('course:list', [filter, page]);
 */
export const createCacheKey = (prefix: string, parts: unknown[]): string => {
  const raw = JSON.stringify(parts);
  const hash = crypto.createHash("md5").update(raw).digest("hex");
  return `${prefix}:${hash}`;
};

export const getCache = async (key: string) => {
  const value = await redis.get(key);
  logger.debug(`Redis: GET → Key: ${key} | Hit: ${value !== null}`);
  return value;
};

export const setCache = async (
  key: string,
  value: string,
  ttlSeconds?: number
) => {
  if (ttlSeconds) {
    const res = await redis.set(key, value, "EX", ttlSeconds);
    logger.debug(`Redis: SET → Key: ${key} | TTL: ${ttlSeconds}s`);
    return !!res;
  } else {
    const res = await redis.set(key, value);
    logger.debug(`Redis: SET → Key: ${key}`);
    return !!res;
  }
};

export const deleteCache = async (key: string) => {
  const result = await redis.del(key);
  logger.debug(`Redis: DEL → Key: ${key} | Hit: ${result === 1}`);
  return !!result;
};

export const checkExists = async (key: string) => {
  const exists = await redis.exists(key);
  logger.debug(`Redis: EXISTS → Key: ${key} | Hit: ${!!exists}`);
  return !!exists;
};

export const setWithTags = async (
  key: string,
  value: string,
  ttlSeconds?: number,
  tags: string[] = []
) => {
  if (ttlSeconds) {
    await redis.set(key, value, "EX", ttlSeconds);
    logger.debug(
      `Redis: SET → Key: ${key} | TTL: ${ttlSeconds}s | Tags: [${tags.join(
        ", "
      )}]`
    );
  } else {
    await redis.set(key, value);
    logger.debug(`Redis: SET → Key: ${key}`);
  }
  logger.debug(`Redis: SET → Key: ${key} | Tags: [${tags.join(", ")}]`);
  const pipeline = redis.multi();
  for (const tag of tags) {
    pipeline.sadd(tagKey(tag), key);
  }
};

export const invalidateTag = async (tag: string) => {
  const _tagKey = tagKey(tag);
  const keys = await redis.smembers(_tagKey);

  if (keys.length > 0) {
    await redis.del(...keys);
    logger.debug(`Redis: DEL → ${keys.length} keys under tag ${tag}`);
  }
  await redis.del(_tagKey); // delete the tag set itself
  return !!keys.length;
};

export const increment = async (key: string) => {
  const count = await redis.incr(key);
  logger.debug(`Redis: INCR → Key: ${key} | Count: ${count}`);
  return count;
};
export const decrement = async (key: string) => {
  const count = await redis.decr(key);
  logger.debug(`Redis: DECR → Key: ${key} | Count: ${count}`);
  return count;
};

export const expire = async (key: string, ttlSeconds: number) => {
  const res = await redis.expire(key, ttlSeconds);
  logger.debug(`Redis: EXPIRE → Key: ${key} | TTL: ${ttlSeconds}s`);
  return !!res;
};

export const getOrSetCache = async <T>(
  key: string,
  ttlSeconds: number,
  tags: string[],
  fallbackFn: () => Promise<T>
) => {
  const cached = await getCache(key);
  if (cached) {
    return JSON.parse(cached) as T;
  }
  const value = await fallbackFn();
  await setWithTags(key, JSON.stringify(value), ttlSeconds, tags);
};
