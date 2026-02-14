import { Router } from "express";
import { verifyAuth } from "../middlewares/auth.middleware.js";
import {
  createSubscription,
  previewSubscription,
  getSubscriptionDetails
} from "../controllers/subscription.controller.js";

const router = Router();
router.use(verifyAuth);

router.get("/", getSubscriptionDetails);
router.post("/create", createSubscription);
router.post("/preview", previewSubscription);

export default router;
