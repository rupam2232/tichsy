import { Router } from "express";
import {
  deleteFoodItemImage,
  foodItemImageUpload,
  restaurantLogoDelete,
  restaurantLogoUpload,
} from "../controllers/media.controller.js";
import { verifyAuth } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import rateLimit from "express-rate-limit";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../env.js";
import { optionalSubscriptionActive } from "../middlewares/subscriptionCheck.middleware.js";
const router = Router();

const restaurantLogoLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minutes
  limit: 5, // Limit each IP to 5 requests per `window` (here, per 1 minutes).
  standardHeaders: "draft-8", //draft-8: `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  handler: () => {
    throw new ApiError(429, "Too many attempts, please try again in a minute.");
  },
});

const foodItemImageLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minutes
  limit: 7, // Limit each IP to 7 requests per `window` (here, per 1 minutes).
  standardHeaders: "draft-8", //draft-8: `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  handler: () => {
    throw new ApiError(429, "Too many attempts, please try again in a minute.");
  },
});

const isProduction = env.NODE_ENV === "production";

router.use(verifyAuth);

router
  .route("/restaurant-logo")
  .post(
    isProduction ? restaurantLogoLimit : (req, res, next) => next(),
    upload.single("restaurantLogo"),
    restaurantLogoUpload
  )
  .delete(restaurantLogoDelete);

router
  .route("/food-item")
  .post(
    isProduction ? foodItemImageLimit : (req, res, next) => next(),
    optionalSubscriptionActive,
    upload.array("foodItemImages", 15),
    foodItemImageUpload
  )
  .delete(deleteFoodItemImage);

export default router;
