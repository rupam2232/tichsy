import { z } from "zod";

export const signUpSchema = z.object({
  email: z
    .email("Email must be a valid email address")
    .trim(),
  password: z
    .string("Password must be a string")
    .min(8, "Password must be at least 8 characters long")
    .max(40, "Password must be at most 40 characters long")
    .regex(
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)[A-Za-z\d@$!%*?&.,:;"'<>/?() [\] {}|\\/~`_^+#=-]{8,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one special character, and one number",
    ),
  confirmPassword: z
    .string("Confirm password must be a string")
    .min(8, "Password must be at least 8 characters long"),
  otp: z
  .string("OTP must be a string")
  .length(6, "OTP must be 6 digits"),
  fullName: z
    .string("Full name must be a string")
    .min(1, "Full name is required")
    .trim(),
  timezone: z.string().optional(),
})
.superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Confirm password must match the password",
      });
    }
  });

export const signInSchema = z.object({
  email: z
    .email("Email must be a valid email address")
    .trim(),
  password: z
    .string("Password must be a string")
    .min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .email("Email must be a valid email address")
    .trim(),
  password: z
    .string("Password must be a string")
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)[A-Za-z\d@$!%*?&.,:;"'<>/?() [\] {}|\\/~`_^+#=-]{8,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one special character, and one number",
    ),
  confirmPassword: z
    .string("Confirm password must be a string")
    .min(8, "Password must be at least 8 characters long"),
  otp: z
    .string("OTP must be a string")
    .length(6, "OTP must be 6 digits"),
})
.superRefine((data, ctx) => {
    if (
      data.password &&
      data.confirmPassword &&
      data.password !== data.confirmPassword
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Confirm password must match the password",
      });
    }
  });
