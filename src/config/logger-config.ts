import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { existsSync, mkdirSync } from "fs";
import { envConfig } from "./env-config.js";

// Ensure logs directory exists
if (!existsSync("logs")) {
  mkdirSync("logs");
}

// Shared JSON format (for files + prod console)
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Pretty console format for dev
const devConsoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length
      ? `\n${JSON.stringify(meta, null, 2)}`
      : "";
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Transports
const transports: winston.transport[] = [
  new DailyRotateFile({
    filename: "logs/%DATE%-error.log",
    datePattern: "YYYY-MM-DD",
    level: "error",
    maxFiles: "14d",
    format: jsonFormat,
  }),
  new DailyRotateFile({
    filename: "logs/%DATE%-combined.log",
    datePattern: "YYYY-MM-DD",
    maxFiles: "14d",
    format: jsonFormat,
  }),
];

// Add console transport
if (envConfig.isDevelopment) {
  transports.push(
    new winston.transports.Console({
      format: devConsoleFormat,
      level: "debug",
    })
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: jsonFormat,
      level: "info",
    })
  );
}

// Create logger
export const logger = winston.createLogger({
  level: envConfig.isDevelopment ? "debug" : "info",
  defaultMeta: { service: "backend-api" },
  transports,
  exitOnError: false,
  exceptionHandlers: [
    new DailyRotateFile({
      filename: "logs/%DATE%-exceptions.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "14d",
      format: jsonFormat,
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: "logs/%DATE%-rejections.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "14d",
      format: jsonFormat,
    }),
  ],
});
