import { Router } from "express";
import {
  logoutController,
  refreshTokenController,
  requestOtpController,
  verifyOtpController,
} from "./auth-controllers.js";

const router = Router();

/**
 * @route   POST /auth/request-otp
 * @desc    Register user by phone number
 */
router.post("/request-otp", requestOtpController);
/**
 * @route   POST /auth/verify-otp
 * @desc    Verify OTP for login or signup
 */
router.post("/verify-otp", verifyOtpController);

/**
 * @route   POST /auth/refresh
 * @desc    Refresh access token
 */
router.post("/refresh", refreshTokenController);

/**
 * @route   POST /auth/logout
 * @desc    Logout
 */
router.post("/logout", logoutController);

export default router;
