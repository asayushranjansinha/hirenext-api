import { Router } from "express";

import {
  getApplications,
  getUserController,
  onboardUserController,
} from "./user-controllers.js";
import { requireAuth } from "@/middlewares/auth-middleware.js";

const router = Router();

// GET /user/my/applications
router.get("/my/applications", requireAuth, getApplications);

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
