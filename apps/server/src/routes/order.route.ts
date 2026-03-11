import { Router } from "express";
import {
  createOrder,
  getOrderById,
  getOrdersByRestaurant,
  getOrderByTable,
  updateOrderStatus,
  updateOrder,
  getOrdersByIds,
  updatePaidStatus,
} from "../controllers/order.controller.js";
import rateLimit from "express-rate-limit";
import { ApiError } from "../utils/ApiError.js";
import { verifyAuth, verifyOptionalAuth } from "../middlewares/auth.middleware.js";
import { verifyRestaurantAccess } from "../middlewares/restaurantAccess.middleware.js";
import { env } from "../env.js";

const isProduction = env.NODE_ENV === "production";
const router = Router();

const createLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minutes
  limit: 3, // Limit each IP to 3 requests per `window` (here, per 1 minutes).
  standardHeaders: "draft-8", //draft-8: `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  handler: () => {
    throw new ApiError(429, "Too many attempts, please try again in a minute.");
  },
});

router.post(
  "/:restaurantSlug/:tableQrSlug",
  isProduction ? createLimit : (req, res, next) => next(),
  createOrder
);

router
  .route("/:restaurantSlug/:orderId")
  .get(verifyOptionalAuth, getOrderById) // Get order by ID
  .patch(verifyAuth, verifyRestaurantAccess, updateOrder); // Update order

router.get("/by-ids", verifyOptionalAuth, getOrdersByIds);

router.get("/:restaurantSlug", verifyAuth, verifyRestaurantAccess, getOrdersByRestaurant);

router.get("/:restaurantSlug/table/:tableQrSlug", verifyAuth, verifyRestaurantAccess, getOrderByTable);

router.patch("/:restaurantSlug/:orderId/status", verifyAuth, verifyRestaurantAccess, updateOrderStatus);

router.patch("/:restaurantSlug/:orderId/paid-status", verifyAuth, verifyRestaurantAccess, updatePaidStatus);

export default router;
