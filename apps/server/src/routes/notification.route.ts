import { Router } from "express";
import { verifyAuth } from "../middlewares/auth.middleware.js";
import {
  getUserNotifications,
  markRead,
  markAllRead,
  markReadByMergeKey,
  deleteNotification,
} from "../controllers/notification.controller.js";
import { rateLimit } from "express-rate-limit";
import { env } from "../env.js";
import { ApiError } from "../utils/ApiError.js";

const isProduction = env.NODE_ENV === "production";

const router = Router();

const notificationsLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minutes
  limit: 60, // Limit each IP to 60 requests per `window` (here, per 1 minutes).
  standardHeaders: "draft-8", //draft-8: `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  handler: () => {
    throw new ApiError(429, "Too many attempts, please try again in a minute");
  },
});

// 1. Apply Rate Limiter to EVERY route in this file
router.use(isProduction ? notificationsLimit : (req, res, next) => next());

// 2. Apply Authentication to EVERY route in this file
router.use(verifyAuth);

// 3. Define the actual routes
router.route("/").get(getUserNotifications);
router.route("/:id").delete(deleteNotification);
router.route("/:id/read").patch(markRead);
router.route("/merge-key/:key/read").patch(markReadByMergeKey);
router.route("/read-all").patch(markAllRead);

export default router;
