import { Router } from "express";
import { verifyAuth } from "../middlewares/auth.middleware.js";
import {
  getUserNotifications,
  markRead,
  markAllRead,
  markReadByMergeKey,
} from "../controllers/notification.controller.js";

const router = Router();

router.use(verifyAuth);

router.route("/").get(getUserNotifications);
router.route("/:id/read").patch(markRead);
router.route("/merge-key/:key/read").patch(markReadByMergeKey);
router.route("/read-all").patch(markAllRead);

export default router;
