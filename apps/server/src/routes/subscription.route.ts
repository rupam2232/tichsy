import { Router } from "express";
import { verifyAuth } from "../middlewares/auth.middleware.js";
import {
  createSubscription,
  previewSubscription,
  getSubscriptionDetails,
  getSubscriptionHistory,
} from "../controllers/subscription.controller.js";

const router = Router();
router.use(verifyAuth);

router.get("/", getSubscriptionDetails);
router.post("/create", createSubscription);
router.post("/preview", previewSubscription);
router.get("/history", getSubscriptionHistory);

export default router;
