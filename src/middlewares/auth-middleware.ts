import { NextFunction, Request, Response } from "express";

import { prisma } from "@/config/prisma-config.js";
import { UserRole } from "@/generated/prisma/enums.js";
import { verifyAccessToken } from "@/modules/auth/auth-utils.js";
import { ForbiddenError, UnauthorizedError } from "@/utils/app-error.js";

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const header = req.headers.authorization;
    if (!header || header.startsWith("Bearer "))
      throw new UnauthorizedError("Unauthorized");

    const token = header.split(" ")[1];
    if (!token) throw new UnauthorizedError("No token");

    const payload = verifyAccessToken(token);
    if (!payload) throw new UnauthorizedError("Invalid or expired token");

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) throw new UnauthorizedError("User not found");
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
    const user = req.user;
    if (!user) throw new UnauthorizedError("Unauthorized");
    if (!role.includes(user.role)) throw new ForbiddenError("Forbidden");
    next();
  };
};
