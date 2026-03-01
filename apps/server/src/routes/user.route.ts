import { Router } from "express";
import {
  getCurrentUser,
  updateProfile,
  verifyCurrentEmail,
  verifyEmailChange,
  changePasswordChange,
  getSessions,
  revokeSession,
  getSecurityEvents,
} from "../controllers/user.controller.js";
import { verifyAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyAuth);

router.get("/me", getCurrentUser);
router.patch("/profile", updateProfile);
router.post("/email/verify-current", verifyCurrentEmail);
router.post("/email/verify", verifyEmailChange);
router.post("/change-password", changePasswordChange);
router.get("/sessions", getSessions);
router.delete("/sessions/:sessionId", revokeSession);
router.get("/security-events", getSecurityEvents);

export default router;
