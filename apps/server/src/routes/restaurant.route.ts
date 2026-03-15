import { Router } from "express";
import {
  verifyAuth,
  verifyOptionalAuth,
} from "../middlewares/auth.middleware.js";
import { verifyRestaurantAccess } from "../middlewares/restaurantAccess.middleware.js";
import {
  checkUniqueRestaurantSlug,
  createRestaurant,
  addRestaurantCategory,
  getOwnedRestaurants,
  getJoinedRestaurants,
  getRestaurantBySlug,
  removeRestaurantCategories,
  setRestaurantTax,
  toggleRestaurantOpenStatus,
  updateRestaurantDetails,
  updateRestaurantLogo,
  getRestaurantCategories,
  getAllStaffOfRestaurant,
  removeStaffFromRestaurant,
  toggleRestaurantArchiveStatus,
  getDashboardOperations,
  getAnalyticsKPIs,
  getAnalyticsRevenue,
  getAnalyticsTrending,
  getAnalyticsCategories,
  getAnalyticsTopTables,
} from "../controllers/restaurant.controller.js";
import { rateLimit } from "express-rate-limit";
import { ApiError } from "../utils/ApiError.js";
import { upload } from "../middlewares/multer.middleware.js";
import { isSubscriptionActive } from "../middlewares/subscriptionCheck.middleware.js";
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

const logoUploadLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minutes
  limit: 10, // Limit each IP to 10 requests per `window` (here, per 1 minutes).
  standardHeaders: "draft-8", //draft-8: `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  handler: () => {
    throw new ApiError(429, "Too many attempts, please try again in a minute.");
  },
});

router.post(
  "/create",
  isProduction ? createLimit : (req, res, next) => next(),
  verifyAuth,
  isSubscriptionActive,
  createRestaurant
);

router.get("/owned", verifyAuth, getOwnedRestaurants);
router.get("/joined", verifyAuth, getJoinedRestaurants);

router
  .route("/:slug")
  .get(verifyOptionalAuth, getRestaurantBySlug)
  .patch(verifyAuth, verifyRestaurantAccess, updateRestaurantDetails);
router.patch(
  "/:slug/toggle-open-status",
  verifyAuth,
  verifyRestaurantAccess,
  toggleRestaurantOpenStatus
);

router.patch(
  "/:slug/toggle-archive-status",
  verifyAuth,
  verifyRestaurantAccess,
  isSubscriptionActive,
  toggleRestaurantArchiveStatus
);

router
  .route("/:slug/categories")
  .get(getRestaurantCategories)
  .post(
    verifyAuth,
    verifyRestaurantAccess,
    isSubscriptionActive,
    addRestaurantCategory
  )
  .patch(verifyAuth, verifyRestaurantAccess, removeRestaurantCategories);

router.post("/:slug/tax", verifyAuth, verifyRestaurantAccess, setRestaurantTax);

router.get("/:slug/dashboard/operations", verifyAuth, verifyRestaurantAccess, getDashboardOperations);
router.get("/:slug/dashboard/analytics/kpis", verifyAuth, verifyRestaurantAccess, getAnalyticsKPIs);
router.get(
  "/:slug/dashboard/analytics/revenue",
  verifyAuth,
  verifyRestaurantAccess,
  getAnalyticsRevenue
);
router.get(
  "/:slug/dashboard/analytics/trending",
  verifyAuth,
  verifyRestaurantAccess,
  getAnalyticsTrending
);
router.get(
  "/:slug/dashboard/analytics/categories",
  verifyAuth,
  verifyRestaurantAccess,
  getAnalyticsCategories
);
router.get(
  "/:slug/dashboard/analytics/top-tables",
  verifyAuth,
  verifyRestaurantAccess,
  getAnalyticsTopTables
);

router.get("/:slug/is-unique-slug", verifyAuth, checkUniqueRestaurantSlug);

router
  .route("/:slug/staff")
  .get(verifyAuth, verifyRestaurantAccess, getAllStaffOfRestaurant)
  .delete(verifyAuth, verifyRestaurantAccess, removeStaffFromRestaurant);

router.post(
  "/:slug/update-logo",
  isProduction ? logoUploadLimit : (req, res, next) => next(),
  verifyAuth,
  verifyRestaurantAccess,
  upload.single("restaurantLogo"),
  updateRestaurantLogo
);

export default router;
