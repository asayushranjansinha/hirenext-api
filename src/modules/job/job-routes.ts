import { Router } from "express";
import { UserRole } from "@/generated/prisma/enums.js";

import { requireAuth, requireRole } from "@/middlewares/auth-middleware.js";
import {
  createController,
  deleteController,
  getByFilters,
  getDetailsController,
  updateController,
  toggleStatusController,
} from "./job-controllers.js";

const router = Router();

// GET /jobs
router.get("/", getByFilters);

// GET /jobs/:id
router.get("/:id", getDetailsController);

// POST /jobs/
router.post(
  "/",
  requireAuth,
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.RECRUITER]),
  createController
);

// PUT /jobs/:id
router.put(
  "/:id",
  requireAuth,
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.RECRUITER]),
  updateController
);

// PATCH /jobs/:id/toggle-status
router.patch(
  "/:id/toggle-status",
  requireAuth,
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.RECRUITER]),
  toggleStatusController
);

// DELETE /jobs/:id
router.delete(
  "/:id",
  requireAuth,
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.RECRUITER]),
  deleteController
);

export default router;
