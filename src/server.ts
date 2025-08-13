import { createApp } from "./app.js";
import { envConfig } from "@/config/env-config.js";

const startServer = async () => {
  try {
    const app = createApp();

    const server = app.listen(envConfig.port, () => {
      console.log(`Server is running on port ${envConfig.port}`);
      console.log(`Environment: ${envConfig.env}`);
    });

    server.on("error", (err) => {
      console.error("❌ Server failed to start: ", err);
      process.exit(1);
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);

      try {
        server.close(() => {
          console.log("Server closed.");
          process.exit(0);
        });

        setTimeout(() => {
          console.log("Forcefully shutting down server in 10 seconds...");
          process.exit(1);
        }, 10000);
      } catch (error) {
        console.error("❌ Error while closing server: ", error);
        process.exit(1);
      }
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Global error handlers
    process.on("unhandledRejection", (reason) => {
      console.error("💥 Unhandled Promise Rejection:", reason);
    });

    process.on("uncaughtException", (err) => {
      console.error("💥 Uncaught Exception:", err);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
