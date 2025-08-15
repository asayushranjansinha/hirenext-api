import { Router } from "express";

import {
  getUserController,
  onboardUserController,
} from "./user-controllers.js";
import { requireAuth } from "@/middlewares/auth-middleware.js";

const router = Router();

/**
 * @route   GET /user
 * @desc    Get user by id
 */
router.get("/me", requireAuth, getUserController);

/**
 * @route   PATCH /onboard
 * @desc    Onboard user
 */
router.patch("/onboard", requireAuth, onboardUserController);

export default router;
