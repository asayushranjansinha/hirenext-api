import { Request, Response } from "express";
import { Prisma } from "@/generated/prisma/client.js";

import { logger } from "@/config/logger-config.js";
import { ApiResponse } from "@/utils/api-response.js";
import { BadRequestError, UnauthorizedError } from "@/utils/app-error.js";

import { UserResponse } from "./user-types.js";
import { parseZodError } from "@/utils/error-utils.js";
import { onboardUserSchema, querySchema } from "./user-validations.js";
import {
  findByIdService,
  findApplications,
  updateService,
} from "./user-services.js";

export const getUserController = async (req: Request, res: Response) => {
  logger.debug("UserController: getUser → Start");
  const id = req.user!.id;
  const select: Prisma.UserSelect = {
    id: true,
    phoneNumber: true,
    name: true,
    role: true,
    hasOnboarded: true,
  };
  logger.debug(`UserController: getUser → User ID: ${id}`);
  const user = await findByIdService(id, select);
  if (!user) {
    logger.error(`UserController: getUser → User not found: ${id}`);
    throw new UnauthorizedError("User not found");
  }

  logger.debug(`UserController: getUser → User fetched: ${user.id}`);

  return res.status(200).json(
    ApiResponse.success<UserResponse>(
      {
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          name: user.name,
          role: user.role,
          hasOnboarded: user.hasOnboarded,
        },
      },
      "User fetched successfully"
    )
  );
};

export const onboardUserController = async (req: Request, res: Response) => {
  logger.debug("UserController: onboardUser → Start");
  const id = req.user!.id;

  const existing = await findByIdService(id);
  if (existing?.hasOnboarded) {
    logger.error(`UserController: onboardUser → User already onboarded: ${id}`);
    throw new BadRequestError("Onboarding already completed");
  }

  const body = onboardUserSchema.safeParse(req.body);
  if (!body.success) {
    const message = parseZodError(body.error);
    logger.error(
      `UserController: onboardUser  → Validation failed: ${message}`
    );
    throw new BadRequestError(message);
  }

  const data = body.data;

  try {
    // Update user
    const updated = await updateService(id, data);
    logger.debug(`UserController: onboardUser → User updated: ${id}`);
    return res.status(200).json(
      ApiResponse.success<UserResponse>(
        {
          user: {
            id: updated.id,
            phoneNumber: updated.phoneNumber,
            name: updated.name,
            role: updated.role,
            hasOnboarded: updated.hasOnboarded,
          },
        },
        "User updated successfully"
      )
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      logger.error(`UserController: onboardUser → User not found: ${id}`);
      throw new UnauthorizedError("User not found");
    }
    logger.error(`UserController: onboardUser → Error: ${error}`);
    throw error;
  }
};

/**
 * @route GET /user/my/applications
 * @desc Get user applications
 * @access Authenticated
 */
export const getApplications = async (req: Request, res: Response) => {
  // Validate user id
  const userId = req.user!.id;
  logger.info(`UserController: getApplications → User ID: ${userId}`);

  // Validate request query
  const query = querySchema.safeParse(req.query);
  if (!query.success) {
    const message = parseZodError(query.error);
    logger.error(
      `UserController: getApplications → Invalid Query params: ${message}`
    );
    throw new BadRequestError(message);
  }
  const { page = 1, limit = 10 } = query.data;

  // Find applications
  const { applications, total } = await findApplications(userId, page, limit);
  const totalPages = Math.ceil(total / limit);
  logger.info(
    `UserController: getApplications → Applications fetched: ${applications.length} | Total pages: ${total}`
  );

  return res.json(
    ApiResponse.paginated(applications, {
      page,
      limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
      hasMore: page < totalPages,
    })
  );
};
