import { z } from "zod";

export const forgotPasswordSchema = z
  .object({
    email: z.email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(
        /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)[A-Za-z\d@$!%*?&.,:;"'<>/?() [\] {}|\\/~`_^+#=-]{8,}$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one special character, and one number",
      )
      .optional(),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .optional(),
    otp: z.string().optional(),
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
