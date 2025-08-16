import { Router } from "express";
import { UserRole } from "@/generated/prisma/enums.js";

import {
  createController,
  deleteController,
  getOneController,
  updateController,
} from "./company-controllers.js";
import { requireAuth, requireRole } from "@/middlewares/auth-middleware.js";

const router = Router();

// POST /companies
router.post(
  "/",
  requireAuth,
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.RECRUITER]),
  createController
);

// GET /companies/:id
router.get("/:id", getOneController);

// PUT /companies/:id
router.put(
  "/:id",
  requireAuth,
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.RECRUITER]),
  updateController
);

// DELETE /companies/:id
router.delete(
  "/:id",
  requireAuth,
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.RECRUITER]),
  deleteController
);

export default router;
