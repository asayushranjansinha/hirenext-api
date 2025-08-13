import express from "express";
import morgan from "morgan";

import { Prisma } from "./generated/prisma/client.js";
import { UserRole } from "./generated/prisma/enums.js";

import { envConfig } from "@/config/env-config.js";
import { prisma } from "@/config/prisma-config.js";
import { ConflictError } from "@/utils/app-error.js";
import { ApiResponse } from "@/utils/api-response.js";
import { errorMiddleware } from "@/middlewares/error-middleware.js";

export const createApp = (): express.Application => {
  const app = express();

  // Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logging middleware
  app.use(morgan("combined"));

  // Base API route
  app.get("/api", (_req, res) => {
    res.json(ApiResponse.success(null, "Welcome to API"));
  });

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json(
      ApiResponse.success(
        {
          status: "ok",
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: envConfig.env,
        },
        "API is running"
      )
    );
  });

  // Route: Add user
  app.post("/api/users", async (req, res, next) => {
    try {
      const { phoneNumber, googleId, role, lastRefreshId } = req.body;

      if (!phoneNumber && !googleId) {
        return res
          .status(400)
          .json(
            ApiResponse.error(
              "At least one of phoneNumber or googleId is required",
              400
            )
          );
      }

      const user = await prisma.user.create({
        data: {
          phoneNumber,
          googleId,
          role: role ?? UserRole.STUDENT,
          lastRefreshId,
        },
      });

      res.status(201).json(ApiResponse.success(user, "User created"));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ConflictError(
            "User with provided phoneNumber or googleId already exists"
          );
        }
      }
      next(error);
    }
  });

  // Route: List users
  app.get("/api/users", async (_req, res, next) => {
    try {
      const users = await prisma.user.findMany();
      res.json(ApiResponse.success(users, "Users fetched"));
    } catch (error) {
      next(error);
    }
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json(
      ApiResponse.error("Route not found", 404, {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
      })
    );
  });

  // Global error handler
  app.use(errorMiddleware);

  return app;
};

export default createApp;
