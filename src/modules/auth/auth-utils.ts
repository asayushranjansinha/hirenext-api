import crypto from "crypto";
import jwt, { JwtPayload as DefaultJwtPayload } from "jsonwebtoken";

import { logger } from "@/config/logger-config.js";
import {
  deleteCache,
  expire,
  getCache,
  increment,
  setCache,
} from "@/utils/redis-utils.js";
import { envConfig } from "@/config/env-config.js";
import { UserRole } from "@/generated/prisma/enums.js";

/** OTP Utils */
const otpKey = (phone: string) => `otp:${phone}`;
const otpRateLimitKey = (phone: string) => `otp:rate:${phone}`;

const OTP_TTL_SECONDS = envConfig.otp.ttlSeconds;

// Generate a random OTP code defaulting to 6 digits
export const generateOtp = (digits = 6) => {
  if (envConfig.isDevelopment) {
    return "123456";
  }
  const max = 10 ** digits;
  const num = crypto.randomInt(0, max);
  logger.debug(`OTP: Generated OTP: ${num.toString().padStart(digits, "0")}`);
  return num.toString().padStart(digits, "0");
};

// Store OTP in Redis with TTL
export const storeOtp = async (phone: string, otp: string) => {
  await setCache(otpKey(phone), otp, OTP_TTL_SECONDS);

  // Increment rate limit counter
  const key = otpRateLimitKey(phone);
  const count = await increment(key);

  // Expire key after 1 hour: Max 5 attempts per hour (1 hour = 60 min * 60 sec)
  if (count === 1) await expire(key, 60 * 60);
  logger.debug(`OTP: Stored OTP: ${otp}`);
  return count;
};

// Verify OTP
export const verifyOtp = async (phone: string, otp: string) => {
  if (envConfig.isDevelopment) {
    if (otp === "123456") {
      return true;
    }
    return false;
  }
  const key = otpKey(phone);
  const storedOtp = await getCache(key);
  if (!storeOtp) return false;
  if (storedOtp !== otp) return false;
  const res = await deleteCache(key);
  logger.debug(`OTP: Verified OTP: ${otp}`);
  return !!res;
};

// Get otp count
export const getOtpCount = async (phone: string) => {
  const key = otpRateLimitKey(phone);
  const count = await getCache(key);
  logger.debug(`OTP: Get OTP count: ${count}`);
  return Number(count);
};

/** SMS Utils */
export const sendSMS = async (phone: string, message: string) => {
  // TODO: Send SMS
  console.log(
    `TODO: Send SMS Placeholder: phone: ${phone}, message: ${message}`
  );
};

/** JWT Utils */

const refreshKey = (tid: string) => `refresh:${tid}`;

export interface JwtPayload extends DefaultJwtPayload {
  sub: string; // user.id
  tid: string; // token id (for refresh token tracking)
  role: UserRole;
}
export function signAccessToken(payload: Omit<JwtPayload, "tid">): string {
  logger.debug(`JWT: Sign access token: userId ${payload.sub}`);

  const expiresIn = envConfig.jwt.accessExpires as jwt.SignOptions["expiresIn"];

  return jwt.sign(payload, envConfig.jwt.accessSecret, { expiresIn });
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    logger.debug(`JWT: Verify access token: ${token.slice(0, 5)}`);
    return jwt.verify(token, envConfig.jwt.accessSecret) as JwtPayload;
  } catch (error) {
    return null;
  }
}

export const createRefreshToken = async (userId: string, role: UserRole) => {
  const tid = crypto.randomBytes(16).toString("hex");
  const payload: JwtPayload = { sub: userId, tid, role };

  const token = jwt.sign(payload, envConfig.jwt.refreshSecret, {
    expiresIn: envConfig.jwt.refreshExpires as jwt.SignOptions["expiresIn"],
  });

  // Store a fingerprint of the token in Redis to allow serve side revokation
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  // TTL Convert to seconds
  const ttlSeconds = 30 * 24 * 60 * 60; // 30 days default
  await setCache(refreshKey(tid), tokenHash, ttlSeconds);

  logger.debug(`JWT: Create refresh token: ${token.slice(0, 5)}`);

  return { token, tid };
};

export const verifyRefreshToken = async (token: string) => {
  try {
    const payload = jwt.verify(
      token,
      envConfig.jwt.refreshSecret
    ) as JwtPayload;
    const stored = await getCache(refreshKey(payload.tid));
    if (!stored) return null;

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    if (stored !== tokenHash) return null;

    return payload;
  } catch (error) {
    logger.error(`verifyRefreshToken Error: ${error}`);
    return null;
  }
};

export const revokeRefreshToken = async (tid: string) => {
  const key = refreshKey(tid);
  const res = await deleteCache(key);
  logger.debug(`JWT: Revoke refresh token: ${tid}`);
  return !!res;
};

/** Phone Utils */
export const normalizePhone = (phone: string) =>
  phone.replace(/[^0-9]/g, "").replace(/^91/, "");
