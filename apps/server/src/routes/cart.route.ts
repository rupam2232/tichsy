import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { ApiError } from "../utils/ApiError.js";
import { addToCart, clearCart, getCartItems, removeFromCart, updateCartItem } from "../controllers/cart.controller.js";
import { verifyOptionalAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// Rate limiting middleware to prevent abuse
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minutes
  limit: 25, // Limit each IP to 25 requests per `window` (here, per 1 minutes).
  standardHeaders: "draft-8", //draft-8: `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  handler: () => {
    throw new ApiError(429, "Too many attempts, please try again in a minute.");
  },
});

const isProduction = process.env?.NODE_ENV === "production";
// Apply rate limiting only in production
if (isProduction) router.use(limiter);
router.use(verifyOptionalAuth)

router.route("/:restaurantSlug")
.post(addToCart)
.get(getCartItems)
.delete(clearCart);

router.route("/:restaurantSlug/:foodId")
.delete(removeFromCart)
.patch(updateCartItem);

export default router;