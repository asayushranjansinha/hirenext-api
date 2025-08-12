import { envConfig } from "@/config/env-config.js";
import prisma from "@/config/prisma-config.js";
import { UserRole } from "@prisma/client";
import express from "express";

export const createApp = (): express.Application => {
  const app = express();

  // Add middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Add routes
  app.get("/api", (_req, res) => {
    res.json({
      message: "Welcome to API",
      success: true,
      data: null,
      errors: null,
    });
  });

  // Health check
  app.get("/api/health", (_req, res) => {
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

  // Route: Add user
  app.post("/api/users", async (req, res) => {
    try {
      const { phoneNumber, googleId, role, lastRefreshId } = req.body;

      // Basic validation (expand as needed)
      if (!phoneNumber && !googleId) {
        return res.status(400).json({
          message: "At least one of phoneNumber or googleId is required",
          success: false,
        });
      }

      const user = await prisma.user.create({
        data: {
          phoneNumber,
          googleId,
          role: role ?? UserRole.STUDENT, // default if not provided
          lastRefreshId,
        },
      });

      res
        .status(201)
        .json({ message: "User created", success: true, data: user });
    } catch (error: any) {
      // Handle unique constraint violation etc.
      if (error.code === "P2002") {
        return res.status(409).json({
          message: "User with provided phoneNumber or googleId already exists",
          success: false,
        });
      }

      res.status(500).json({
        message: "Failed to create user",
        success: false,
        error: error.message,
      });
    }
  });

  // Route: List users
  app.get("/api/users", async (_req, res) => {
    try {
      const users = await prisma.user.findMany();
      res.json({ message: "Users fetched", success: true, data: users });
    } catch (error: any) {
      res
        .status(500)
        .json({
          message: "Failed to fetch users",
          success: false,
          error: error.message,
        });
    }
  });

  return app;
};

export default createApp;
