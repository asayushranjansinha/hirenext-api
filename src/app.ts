import express from "express";
import { envConfig } from "@/config/env-config.js";

export const createApp = (): express.Application => {
  const app = express();

  // Add middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Add routes
  app.get("/", (_req, res) => {
    res.json({
      message: "Welcome to API",
      success: true,
      data: null,
      errors: null,
    });
  });

  // Health check
  app.get("/health", (_req, res) => {
    res.json({
      message: "API is running",
      success: true,
      data: {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: envConfig.env,
      },
      errors: null,
    });
  });

  return app;
};

export default createApp;
