// Schemas
export { foodItemSchema } from "./schemas/foodItemSchema.js";
export {
  createRestaurantSchema,
  addCategorySchema,
  updateRestaurantSchema,
  addStaffSchema,
} from "./schemas/restaurantSchema.js";
export {
  signInSchema,
  signUpSchema,
  forgotPasswordSchema,
} from "./schemas/authSchema.js";
export { tableSchema } from "./schemas/tableSchema.js";
export { sendOtpSchema, verifyOtpSchema } from "./schemas/otpSchema.js";
export { verifyPaymentSchema } from "./schemas/paymentSchema.js";
export { createOrderSchema } from "./schemas/orderSchema.js";
export {
  addToCartSchema,
  updateCartItemSchema,
  removeFromCartSchema,
} from "./schemas/cartSchema.js";
export {
  createSubscriptionSchema,
  createOrUpdateSubscriptionSchema,
} from "./schemas/subscriptionSchema.js";
export {
  restaurantLogoUploadSchema,
  restaurantLogoDeleteSchema,
  foodItemImageUploadSchema,
  foodItemImageDeleteSchema,
} from "./schemas/mediaSchema.js";

// Interfaces
export * from "./interfaces/ApiResponse.js";

export {
  type FoodItem,
  type FoodVariant,
  type FoodItemDetails,
  type AllFoodItems,
} from "./interfaces/FoodItem.js";

export {
  type Order,
  type OrderFoodItem,
  type DetailedFoodItemDetails,
  type OrderDetails,
  type FullOrderDetailsType,
} from "./interfaces/Order.js";

export {
  type RestaurantMinimalInfo,
  type RestaurantFullInfo,
  type RestaurantStaffData,
} from "./interfaces/Restaurant.js";

export {
  type StaffDashboardStats,
  type OwnerDashboardStats,
  type DashboardStats,
  type DashboardOperations,
  type DashboardAnalytics,
} from "./interfaces/Stats.js";

export { type CurrentSubscription } from "./interfaces/Subscription.js";

export {
  type Table,
  type TableDetails,
  type AllTables,
} from "./interfaces/Table.js";
