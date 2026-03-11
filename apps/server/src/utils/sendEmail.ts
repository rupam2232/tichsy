import nodemailer from "nodemailer";
import { env } from "../env.js";

type T = {
  success: boolean;
  message: string;
};

const optionsArray = [
  {
    context: "signup",
    emailCategory: "Email Verification",
    subject: "Verify your email",
  },
  {
    context: "signup-success",
    emailCategory: "Signup",
    subject: "Sign up successful",
  },
  {
    context: "change-password",
    emailCategory: "Change password",
    subject: "Password change request",
  },
  {
    context: "change-email",
    emailCategory: "Email Change",
    subject: "Email change request",
  },
  {
    context: "verify-current-email",
    emailCategory: "Email Change Verification",
    subject: "Verify your email change request",
  },
  {
    context: "forgot-password",
    emailCategory: "Forgot password",
    subject: "Forgot password request",
  },
  {
    context: "new-login",
    emailCategory: "New Login",
    subject: "New login detected",
  },
  {
    context: "restaurant-created",
    emailCategory: "Restaurant Created",
    subject: "Your restaurant has been created",
  },
  {
    context: "password-reset-success",
    emailCategory: "Password Reset",
    subject: "Password reset successful",
  },
  {
    context: "email-change-success",
    emailCategory: "Email Change",
    subject: "Your email has been changed",
  },
  {
    context: "invitation",
    emailCategory: "Invitation",
    subject: "You have been invited to join a restaurant",
  },
];

async function sendEmail(
  email: string,
  context:
    | "signup"
    | "signup-success"
    | "change-password"
    | "change-email"
    | "verify-current-email"
    | "new-login"
    | "restaurant-created"
    | "password-reset-success"
    | "forgot-password"
    | "invitation"
    | "email-change-success",
  template: string
): Promise<T> {
  try {
    const transporter = nodemailer.createTransport({
      service: env.EMAIL_SERVICE,
      auth: {
        user: env.EMAIL,
        pass: env.EMAIL_PASSWORD,
      },
    });

    for (const options of optionsArray) {
      if (context === options.context) {
        await transporter.sendMail({
          from: `"${env.SERVER_NAME}" <${env.EMAIL}>`,
          to: email,
          subject: options.subject,
          html: template,
          headers: { "X-Email-Category": options.emailCategory },
        });
        return {
          success: true,
          message: "Email sent successfully",
        };
      }
    }
    return {
      success: false,
      message: "Please provide a valid context",
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      message: "Failed to send email",
    };
  }
}

export default sendEmail;
