import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .optional(),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .optional(),
  avatar: z.url("Invalid image URL").optional(),
});

export const verifyCurrentEmailSchema = z.object({
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
});

export const changeEmailSchema = z.object({
  newEmail: z.email("Invalid email address"),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string("Password must be a string")
      .min(8, "Password must be at least 8 characters long")
      .regex(
        /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)[A-Za-z\d@$!%*?&.,:;"'<>/?() [\] {}|\\/~`_^+#=-]{8,}$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one special character, and one number",
      ),
    confirmPassword: z
      .string("Confirm password must be a string")
      .min(8, "Password must be at least 8 characters long"),
    otp: z.string().length(6, "OTP must be exactly 6 digits"),
  })
  .superRefine((data, ctx) => {
    if (
      data.newPassword &&
      data.confirmPassword &&
      data.newPassword !== data.confirmPassword
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Confirm password must match the password",
      });
    }
  })
  .superRefine((data, ctx) => {
    if (
      data.newPassword &&
      data.currentPassword &&
      data.newPassword === data.currentPassword
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "New password cannot be same as current password",
      });
    }
  });
