import { Request, Response } from "express";

import { envConfig } from "@/config/env-config.js";
import { logger } from "@/config/logger-config.js";
import { ApiResponse } from "@/utils/api-response.js";
import {
  BadRequestError,
  TooManyRequestsError,
  UnauthorizedError,
} from "@/utils/app-error.js";
import { parseZodError } from "@/utils/error-utils.js";

import { UserRole } from "@/generated/prisma/enums.js";
import {
  attachRefreshTokenService,
  findOrCreateUserByPhone,
  revokeRefreshTokenService,
} from "./auth-services.js";
import { AuthResponse } from "./auth-types.js";
import {
  createRefreshToken,
  generateOtp,
  getOtpCount,
  normalizePhone,
  sendSMS,
  signAccessToken,
  storeOtp,
  verifyOtp,
  verifyRefreshToken,
} from "./auth-utils.js";
import { otpVerifySchema, requestOtpSchema } from "./auth-validations.js";

export const requestOtpController = async (req: Request, res: Response) => {
  logger.debug("AuthController: requestOtp → Start");

  const body = requestOtpSchema.safeParse(req.body);
  if (!body.success) {
    const message = parseZodError(body.error);
    logger.error(`AuthController: requestOtp → Validation failed: ${message}`);
    throw new BadRequestError(message);
  }

  const phoneNumber = normalizePhone(body.data.phoneNumber as string);
  const rate = await getOtpCount(phoneNumber);
  if (rate > envConfig.otp.rateLimit) {
    logger.error(
      `AuthController: requestOtp → Phone number rate limit exceeded: ${phoneNumber}`
    );
    throw new TooManyRequestsError("Too many otp attempts, try again later");
  }

  const otp = generateOtp();
  await storeOtp(phoneNumber, otp);
  await sendSMS(phoneNumber, otp);
  logger.debug(
    `AuthController: requestOtp → OTP sent successfully to ${phoneNumber}`
  );
  return res.status(200).json(
    ApiResponse.success<AuthResponse>(
      {
        user: null,
        tokens: null,
      },
      "OTP sent successfully"
    )
  );
};

export const verifyOtpController = async (req: Request, res: Response) => {
  logger.debug("AuthController: verifyOtp → Start ");

  const body = otpVerifySchema.safeParse(req.body);
  if (!body.success) {
    const message = parseZodError(body.error);
    logger.error(`AuthController: verifyOtp → Validation failed: ${message}`);
    throw new BadRequestError(message);
  }

  const phoneNumber = normalizePhone(body.data.phoneNumber);
  const otp = body.data.otp;

  const isValidOtp = await verifyOtp(phoneNumber, otp);
  if (!isValidOtp) {
    logger.error(`AuthController: verifyOtp → Invalid OTP for ${phoneNumber}`);
    throw new BadRequestError("Invalid or expired OTP");
  }
  logger.debug(`AuthController: verifyOtp → OTP verified for ${phoneNumber}`);

  // Find or create user
  const user = await findOrCreateUserByPhone(phoneNumber);

  // Create tokens
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const { token: refreshToken } = await createRefreshToken(
    user.id,
    user.role as UserRole
  );

  return res.status(200).json(
    ApiResponse.success<AuthResponse>(
      {
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          role: user.role as UserRole,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
      "OTP sent successfully"
    )
  );
};

export const refreshTokenController = async (req: Request, res: Response) => {
  const token = req.body?.refreshToken;
  if (!token) throw new UnauthorizedError("No refresh token");

  // Verify refresh token
  const payload = await verifyRefreshToken(token);
  if (!payload) throw new UnauthorizedError("Invalid or expired token");

  // Revoke old refresh token
  await revokeRefreshTokenService(payload.sub, payload.tid);

  // Create new tokens
  const accessToken = signAccessToken({ sub: payload.sub, role: payload.role });
  const { token: refreshToken, tid } = await createRefreshToken(
    payload.sub,
    payload.role
  );

  // Attach refresh token to user
  const user = await attachRefreshTokenService(payload.sub, tid);
  if (!user) throw new UnauthorizedError("User not found");

  return res.status(200).json(
    ApiResponse.success(
      {
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          role: user.role as UserRole,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
      "Tokens refreshed successfully"
    )
  );
};

export const logoutController = async (req: Request, res: Response) => {
  const token = req.body?.refreshToken;
  if (!token) throw new UnauthorizedError("Unauthorized");

  // Verify refresh token and revoke
  const payload = await verifyRefreshToken(token);
  if (payload) {
    await revokeRefreshTokenService(payload.sub, payload.tid);
  }
  return res.status(200).json(
    ApiResponse.success<AuthResponse>(
      {
        user: null,
        tokens: null,
      },
      "Logged out successfully"
    )
  );
};
