import { Router } from "express";
import {
  google,
  signin,
  signout,
  signup,
  forgotPassword,
} from "../controllers/auth.controller.js";
import { rateLimit } from "express-rate-limit";
import { ApiError } from "../utils/ApiError.js";
import { verifyAuth } from "../middlewares/auth.middleware.js";
import { verifyOtp } from "../middlewares/verifyOtp.middleware.js";
import { env } from "../env.js";

const isProduction = env.NODE_ENV === "production";

const router = Router();

// Rate limiting middleware to prevent abuse
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minutes
  limit: 3, // Limit each IP to 3 requests per `window` (here, per 1 minutes).
  standardHeaders: "draft-8", //draft-8: `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  handler: () => {
    throw new ApiError(429, "Too many attempts, please try again in a minute.");
  },
});

// Apply rate limiting only in production
if (isProduction) router.use(limiter);

router.post("/signup", verifyOtp, signup);
router.post("/signin", signin);
router.post("/forgot-password", verifyOtp, forgotPassword);
router.post("/google", google);
router.post("/signout", verifyAuth, signout);

export default router;
