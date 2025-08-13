import { NextFunction, Request, Response } from "express";

import { envConfig } from "@/config/env-config.js";
import { logger } from "@/config/logger-config.js";
import { ApiResponse } from "@/utils/api-response.js";
import { ApiError } from "@/utils/app-error.js";

/**
 * Global error handler middleware
 */
export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = "Internal Server Error";
  let isOperational = false;

  // Identify known operational errors
  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    isOperational = error.isOperational;
  } else if (error.name === "ValidationError") {
    statusCode = 400;
    message = "Validation Error";
    isOperational = true;
  } else if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
    isOperational = true;
  } else if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
    isOperational = true;
  } else if (error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
    isOperational = true;
  }
  // Handle Redis/Bull-specific errors
  else if (
    error.message?.includes("ECONNREFUSED") ||
    error.message?.includes("Redis") ||
    error.message?.includes("Bull")
  ) {
    statusCode = 503;
    message = "Service temporarily unavailable";
    isOperational = true; // Don't crash the app
  }

  // Log the error
  logger.error(`Error ${statusCode}: ${message}`, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    stack: envConfig.isDevelopment ? error.stack : undefined,
    name: error.name,
    isOperational,
  });

  const errorResponse = ApiResponse.error(message, statusCode, {
    isOperational,
    ...(envConfig.isDevelopment && {
      stack: error.stack,
      name: error.name,
    }),
  });

  res.status(statusCode).json(errorResponse);
};
