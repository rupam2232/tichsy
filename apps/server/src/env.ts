import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.url("Invalid MongoDB URI"),
  PORT: z.string("Invalid port").transform(Number),
  CORS_ORIGIN: z
    .string("Invalid CORS origin")
    .transform((str) => str.split(",").map((s) => s.trim())),
  NODE_ENV: z.enum(["development", "production", "test"]),
  GOOGLE_CLIENT_ID: z.string("Invalid Google client ID").min(1),
  GOOGLE_CLIENT_SECRET: z.string("Invalid Google client secret").min(1),
  SERVER_NAME: z.string("Invalid server name").min(1),
  EMAIL: z.email("Invalid email"),
  EMAIL_PASSWORD: z.string("Invalid email password").min(1),
  EMAIL_SERVICE: z.string("Invalid email service").min(1),
  COOKIE_DOMAIN: z.string("Invalid cookie domain").min(1),
  ACCESS_TOKEN_EXPIRY: z.string("Invalid access token expiry").transform(Number),
  ACCESS_TOKEN_SECRET: z.string("Invalid access token secret").min(1),
  REFRESH_TOKEN_EXPIRY: z.string("Invalid refresh token expiry").transform(Number),
  REFRESH_TOKEN_SECRET: z.string("Invalid refresh token secret").min(1),
  CLOUDINARY_URL: z.url("Invalid Cloudinary URL"),
  MEDIA_ORIGIN: z.url("Invalid media origin"),
  MEDIA_PATH_NAME: z.string("Invalid media path name").min(1),
  MAIN_MEDIA_FOLDER_NAME: z.string("Invalid main media folder name").min(1),
  RAZORPAY_KEY_ID: z.string("Invalid Razorpay key ID").min(1),
  RAZORPAY_KEY_SECRET: z.string("Invalid Razorpay key secret").min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string("Invalid Razorpay webhook secret").min(1),
  RAZORPAY_WEBHOOK_URL: z.url("Invalid Razorpay webhook URL"),
});

export const env = envSchema.parse(process.env);
