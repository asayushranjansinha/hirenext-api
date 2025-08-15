import { z } from "zod";

export const onboardUserSchema = z.object({
  age: z
    .number()
    .int()
    .min(0, { message: "Age must be a positive number" })
    .max(120, { message: "Age must be realistic" })
    .optional(),

  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),

  name: z
    .string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name must be less than 100 characters" })
    .optional(),

  email: z.email({ message: "Invalid email address" }).optional(),

  bio: z
    .string()
    .trim()
    .max(500, { message: "Bio must be less than 500 characters" })
    .optional(),

  education: z
    .string()
    .trim()
    .max(200, { message: "Education must be less than 200 characters" })
    .optional(),

  schoolOrCollege: z
    .string()
    .trim()
    .max(200, { message: "School/College must be less than 200 characters" })
    .optional(),

  interests: z
    .array(z.string().trim().min(1))
    .max(50, { message: "You can only have up to 50 interests" })
    .optional(),

  skills: z
    .array(z.string().trim().min(1))
    .max(50, { message: "You can only have up to 50 skills" })
    .optional(),
});

export type OnboardUserInput = z.infer<typeof onboardUserSchema>;
