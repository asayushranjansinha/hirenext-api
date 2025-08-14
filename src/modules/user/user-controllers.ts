import { Prisma } from "@/generated/prisma/client.js";
import { UserRole } from "@/generated/prisma/enums.js";
import { Request, Response } from "express";

import { logger } from "@/config/logger-config.js";
import { ApiResponse } from "@/utils/api-response.js";
import { UnauthorizedError } from "@/utils/app-error.js";

import { findByIdService } from "./user-services.js";
import { UserResponse } from "./user-types.js";

export const getUserController = async (req: Request, res: Response) => {
  logger.debug("UserController: getUser → Start");
  const id = req.user!.id;
  const select: Prisma.UserSelect = {
    id: true,
    phoneNumber: true,
    role: true,
  };
  logger.debug(`UserController: getUser → User ID: ${id}`);
  const user = await findByIdService(id);
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
          role: user.role as UserRole,
        },
      },
      "User fetched successfully"
    )
  );
};
