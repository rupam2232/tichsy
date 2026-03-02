import { Router } from "express";
import {
  getCurrentUser,
  updateProfile,
  verifyCurrentEmail,
  verifyEmailChange,
  changePassword,
  getSessions,
  revokeSession,
  getSecurityEvents,
} from "../controllers/user.controller.js";
import { verifyAuth } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { rateLimit } from "express-rate-limit";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../env.js";

const isProduction = env.NODE_ENV === "production";

const router = Router();

const updateProfileLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minutes
  limit: 10, // Limit each IP to 10 requests per `window` (here, per 1 minutes).
  standardHeaders: "draft-8", //draft-8: `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  handler: () => {
    throw new ApiError(429, "Too many attempts, please try again in a minute");
  },
});

router.use(verifyAuth);

router.get("/me", getCurrentUser);
router.patch(
  "/profile",
  isProduction ? updateProfileLimit : (req, res, next) => next(),
  upload.single("avatar"),
  updateProfile
);
router.post("/email/verify-current", verifyCurrentEmail);
router.patch("/change-email", verifyEmailChange);
router.patch("/change-password", changePassword);
router.get("/sessions", getSessions);
router.delete("/sessions/:sessionId", revokeSession);
router.get("/security-events", getSecurityEvents);

export default router;
