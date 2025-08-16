import { z } from "zod";

export const createSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, { message: "Name must be at least 3 characters long" })
    .max(50, { message: "Name must be less than 50 characters" }),
  website: z.url({ message: "Website must be a valid URL" }),
});

export const companyIdSchema = z.object({
  id: z.cuid({ message: "Invalid company ID format" }),
});

export const updateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, { message: "Name must be at least 3 characters long" })
    .max(50, { message: "Name must be less than 50 characters" })
    .optional(),
  website: z.url({ message: "Website must be a valid URL" }).optional(),
});
