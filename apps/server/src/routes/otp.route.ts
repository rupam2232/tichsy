import { Router, type RequestHandler } from "express";
import { sendOtp, verifyOtp } from "../controllers/otp.controller.js";
import rateLimit from "express-rate-limit";
import { ApiError } from "../utils/ApiError.js";
import { verifyOptionalAuth } from "../middlewares/auth.middleware.js";
import { env } from "../env.js";

const isProduction = env.NODE_ENV === "production";

const router = Router();

const OTP_SEND_WINDOW_MS = 60 * 60 * 1000;
const OTP_CONTEXT_LIMITS = {
  signup: 3,
  "forgot-password": 5,
  "change-password": 5,
  "change-email": 3,
  "verify-current-email": 3,
} as const;

type OtpContext = keyof typeof OTP_CONTEXT_LIMITS;

const getLimiterKey = (req: Parameters<RequestHandler>[0]) => {
  const context =
    typeof req.body?.context === "string" ? req.body.context : "unknown";
  const email =
    typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";

  if (req.user?.id) {
    return `user:${req.user.id}|ctx:${context}`;
  }

  if (email) {
    return `email:${email}|ctx:${context}`;
  }

  return `ip:${req.ip}|ctx:${context}`;
};

const createOtpLimiter = (limit: number) =>
  rateLimit({
    windowMs: OTP_SEND_WINDOW_MS,
    limit,
    keyGenerator: getLimiterKey,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: () => {
      throw new ApiError(429, "Too many attempts, please try again later");
    },
  });

const fallbackSendLimit = createOtpLimiter(3);

const contextSendLimiters: Record<OtpContext, RequestHandler> = {
  signup: createOtpLimiter(OTP_CONTEXT_LIMITS.signup),
  "forgot-password": createOtpLimiter(OTP_CONTEXT_LIMITS["forgot-password"]),
  "change-password": createOtpLimiter(OTP_CONTEXT_LIMITS["change-password"]),
  "change-email": createOtpLimiter(OTP_CONTEXT_LIMITS["change-email"]),
  "verify-current-email": createOtpLimiter(
    OTP_CONTEXT_LIMITS["verify-current-email"]
  ),
};

const sendLimit: RequestHandler = (req, res, next) => {
  const context =
    typeof req.body?.context === "string"
      ? (req.body.context as OtpContext)
      : undefined;

  const limiter = context ? contextSendLimiters[context] : undefined;
  return (limiter ?? fallbackSendLimit)(req, res, next);
};

router.use(verifyOptionalAuth);

router.post(
  "/send",
  isProduction ? sendLimit : (req, res, next) => next(),
  sendOtp
);
router.post("/verify", verifyOtp);

export default router;