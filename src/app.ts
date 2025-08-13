import express from "express";
import morgan from "morgan";

import { envConfig } from "@/config/env-config.js";
import { ApiResponse } from "@/utils/api-response.js";
import authRoutes from "@/modules/auth/auth-routes.js";
import userRoutes from "@/modules/user/user-routes.js";
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

  app.use("/api/auth", authRoutes);
  app.use("/api/user", userRoutes);

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
