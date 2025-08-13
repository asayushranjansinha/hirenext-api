import { Router } from "express";

import { getUserController } from "./user-controllers.js";
import { requireAuth } from "@/middlewares/auth-middleware.js";

const router = Router();

/**
 * @route   GET /user
 * @desc    Get user by id
 */
router.get("/me", requireAuth, getUserController);

export default router;
