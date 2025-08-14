import { NextFunction, Request, Response } from "express";

import { prisma } from "@/config/prisma-config.js";
import { UserRole } from "@/generated/prisma/enums.js";
import { verifyAccessToken } from "@/modules/auth/auth-utils.js";
import { ForbiddenError, UnauthorizedError } from "@/utils/app-error.js";
import { logger } from "@/config/logger-config.js";

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    logger.debug("AuthMiddleware: requireAuth → Start");
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      logger.debug("AuthMiddleware: requireAuth → No token");
      throw new UnauthorizedError("Unauthorized");
    }

    const token = header.split(" ")[1];
    if (!token) throw new UnauthorizedError("No token");

    const payload = verifyAccessToken(token);
    if (!payload) throw new UnauthorizedError("Invalid or expired token");

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      logger.debug(
        "AuthMiddleware: requireAuth → User not found | User ID: " + payload.sub
      );
      throw new UnauthorizedError("User not found");
    }
    req.user = {
      id: user.id,
      phoneNumber: user.phoneNumber,
      role: user.role,
    };
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (role: UserRole[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    logger.debug("AuthMiddleware: requireRole → Start");
    const user = req.user;
    if (!user) {
      logger.debug(`AuthMiddleware: requireRole → User not found`);
      throw new UnauthorizedError("Unauthorized");
    }
    if (!role.includes(user.role)) {
      logger.debug(`AuthMiddleware: requireRole → Forbidden`);
      throw new ForbiddenError("Forbidden");
    }
    next();
  };
};
