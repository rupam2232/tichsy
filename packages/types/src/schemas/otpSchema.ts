import { z } from "zod";

export const sendOtpSchema = z.object({
  email: z
    .email("Email must be a valid email address"),
  name: z
    .string("Name must be a string")
    .optional(),
  context: z
    .enum(
      ["signup", "forgot-password", "change-password"],
      "Invalid context",
    ),
});

export const verifyOtpSchema = z.object({
  email: z
    .email("Email must be a valid email address"),
  otp: z
    .string("OTP must be a string")
    .length(6, "OTP must be 6 digits"),
  context: z
    .enum(
      ["signup", "forgot-password", "change-password"],
      "Invalid context",
    ),
});
