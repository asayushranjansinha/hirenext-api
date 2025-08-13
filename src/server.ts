import { createApp } from "./app.js";
import { envConfig } from "@/config/env-config.js";
import { logger } from "@/config/logger-config.js";

const startServer = async () => {
  try {
    const app = createApp();

    const server = app.listen(envConfig.port, () => {
      logger.info(`Server is running on port ${envConfig.port}`);
      logger.info(`Environment: ${envConfig.env}`);
    });

    server.on("error", (err) => {
      logger.error("❌ Server failed to start: ", err);
      process.exit(1);
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);

      try {
        server.close(() => {
          logger.info("Server closed.");
          process.exit(0);
        });

        setTimeout(() => {
          logger.info("Forcefully shutting down server in 10 seconds...");
          process.exit(1);
        }, 10000);
      } catch (error) {
        logger.error("❌ Error while closing server: ", error);
        process.exit(1);
      }
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Global error handlers
    process.on("unhandledRejection", (reason) => {
      logger.error("💥 Unhandled Promise Rejection:", reason);
    });

    process.on("uncaughtException", (err) => {
      logger.error("💥 Uncaught Exception:", err);
    });
  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();