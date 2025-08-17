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
  applyController,
  updateApplicationController,
} from "./job-controllers.js";

const router = Router();

// GET /jobs
router.get("/", getByFilters);

// GET /jobs/:id
router.get("/:id", getDetailsController);

// POST /jobs/:id/apply
router.post("/:id/apply", requireAuth, applyController);

// POST /jobs/
router.post(
  "/",
  requireAuth,
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.RECRUITER]),
  createController
);

// PUT /jobs/:id/applications/:applicationId/status
router.put(
  "/:id/applications/:applicationId/status",
  requireAuth,
  requireRole([UserRole.RECRUITER, UserRole.SUPER_ADMIN]),
  updateApplicationController
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
