import { JobType } from "@/generated/prisma/enums.js";
import { z } from "zod";

export const jobIdSchema = z.object({
  id: z.cuid({ message: "Invalid job ID format" }),
});

export const createSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { message: "Title must be at least 3 characters long" })
    .max(30, { message: "Title must be less than 30 characters" }),
  description: z
    .string()
    .trim()
    .min(10, { message: "Description must be at least 10 characters long" }),
  overview: z
    .string()
    .trim()
    .min(10, { message: "Overview must be at least 10 characters long" }),
  companyId: z.cuid({ message: "Invalid company ID format" }),
  type: z.enum(JobType),
  location: z.string().trim().optional(),
  salaryRange: z.string().trim().optional(),
  postingUrl: z.url({ message: "Posting URL must be a valid URL" }),
  requirements: z
    .array(z.string().trim().min(1))
    .min(1, { message: "At least one requirement is required" }),
  benefits: z.array(z.string().trim().min(1)).optional(),
  responsibilities: z.array(z.string().trim().min(1)).optional(),
  skills: z
    .array(z.string().trim().min(1))
    .min(1, { message: "At least one skill is required" }),
  expiresAt: z.coerce.date().optional(),
});

export const filterSchema = z.object({
  location: z.string().optional(),
  type: z.enum(JobType).optional(),
  companyId: z.string().optional(),
  keyword: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export const updateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { message: "Title must be at least 3 characters long" })
    .max(30, { message: "Title must be less than 30 characters" })
    .optional(),
  description: z
    .string()
    .trim()
    .min(10, { message: "Description must be at least 10 characters long" })
    .optional(),
  overview: z
    .string()
    .trim()
    .min(10, { message: "Overview must be at least 10 characters long" })
    .optional(),
  type: z.enum(JobType),
  location: z.string().trim().optional(),
  salaryRange: z.string().trim().optional(),
  postingUrl: z.url({ message: "Posting URL must be a valid URL" }),
  requirements: z
    .array(z.string().trim().min(1))
    .min(1, { message: "At least one requirement is required" }),
  benefits: z.array(z.string().trim().min(1)).optional(),
  responsibilities: z.array(z.string().trim().min(1)).optional(),
  skills: z
    .array(z.string().trim().min(1))
    .min(1, { message: "At least one skill is required" }),
  expiresAt: z.string().optional(),
});
