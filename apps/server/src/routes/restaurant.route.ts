import { Router } from "express";
import {
  verifyAuth,
  verifyOptionalAuth,
} from "../middlewares/auth.middleware.js";
import {
  checkUniqueRestaurantSlug,
  createRestaurant,
  addRestaurantCategory,
  getAllRestaurantofOwner,
  getRestaurantBySlug,
  getRestaurantofStaff,
  removeRestaurantCategories,
  setRestaurantTax,
  toggleRestaurantOpenStatus,
  updateRestaurantDetails,
  updateRestaurantLogo,
  getRestaurantCategories,
  getAllStaffOfRestaurant,
  addStaffToRestaurant,
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
  limit: 1, // Limit each IP to 1 requests per `window` (here, per 1 minutes).
  standardHeaders: "draft-8", //draft-8: `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  handler: () => {
    throw new ApiError(429, "Too many attempts, please try again in a minute.");
  },
});

const logoUploadLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minutes
  limit: 2, // Limit each IP to 2 requests per `window` (here, per 1 minutes).
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

router.get("/owner", verifyAuth, getAllRestaurantofOwner);
router.get("/staff", verifyAuth, getRestaurantofStaff);

router
  .route("/:slug")
  .get(verifyOptionalAuth, getRestaurantBySlug)
  .patch(verifyAuth, updateRestaurantDetails);
router.patch(
  "/:slug/toggle-open-status",
  verifyAuth,
  toggleRestaurantOpenStatus
);

router.patch(
  "/:slug/toggle-archive-status",
  verifyAuth,
  isSubscriptionActive,
  toggleRestaurantArchiveStatus
);

router
  .route("/:slug/categories")
  .get(getRestaurantCategories)
  .post(
    verifyAuth,
    isSubscriptionActive,
    addRestaurantCategory
  )
  .patch(verifyAuth, removeRestaurantCategories);

router.post("/:slug/tax", verifyAuth, setRestaurantTax);

router.get("/:slug/dashboard/operations", verifyAuth, getDashboardOperations);
router.get("/:slug/dashboard/analytics/kpis", verifyAuth, getAnalyticsKPIs);
router.get(
  "/:slug/dashboard/analytics/revenue",
  verifyAuth,
  getAnalyticsRevenue
);
router.get(
  "/:slug/dashboard/analytics/trending",
  verifyAuth,
  getAnalyticsTrending
);
router.get(
  "/:slug/dashboard/analytics/categories",
  verifyAuth,
  getAnalyticsCategories
);
router.get(
  "/:slug/dashboard/analytics/top-tables",
  verifyAuth,
  getAnalyticsTopTables
);

router.get("/:slug/is-unique-slug", verifyAuth, checkUniqueRestaurantSlug);

router
  .route("/:slug/staff")
  .get(verifyAuth, getAllStaffOfRestaurant)
  .post(verifyAuth, addStaffToRestaurant)
  .delete(verifyAuth, removeStaffFromRestaurant);

router.post(
  "/:slug/update-logo",
  isProduction ? logoUploadLimit : (req, res, next) => next(),
  verifyAuth,
  upload.single("restaurantLogo"),
  updateRestaurantLogo
);

export default router;
