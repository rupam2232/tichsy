import { Router } from "express";
import {
  sendInvitation,
  getInvitations,
  revokeInvitation,
  verifyInvitation,
  acceptInvitation,
  rejectInvitation,
} from "../controllers/invitation.controller.js";
import { verifyAuth } from "../middlewares/auth.middleware.js";
import { verifyRestaurantAccess } from "../middlewares/restaurantAccess.middleware.js";
import { isSubscriptionActive } from "../middlewares/subscriptionCheck.middleware.js";

const router = Router();

// Owner operations on a restaurant's invitations
router.post("/:restaurantSlug/send", verifyAuth, verifyRestaurantAccess, isSubscriptionActive, sendInvitation);
router.get("/:restaurantSlug", verifyAuth, verifyRestaurantAccess, getInvitations);
router.delete("/:restaurantSlug/:id/revoke", verifyAuth, verifyRestaurantAccess, revokeInvitation);

// User operations on an invitation token
router.get("/verify/:token", verifyInvitation); // Public or Optional auth, but token is secure
router.post("/accept/:token", verifyAuth, acceptInvitation);
router.post("/reject/:token", verifyAuth, rejectInvitation);

export default router;
