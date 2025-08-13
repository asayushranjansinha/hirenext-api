import { z } from "zod";

export const requestOtpSchema = z.object({
  phoneNumber: z.string().min(6).optional(),
});

export const otpVerifySchema = z.object({
  phoneNumber: z.string().min(1),
  otp: z.string().min(1),
});
