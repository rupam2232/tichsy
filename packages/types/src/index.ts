// Schemas
export { foodItemSchema } from "./schemas/foodItemSchema.js";
export {
  createRestaurantSchema,
  addCategorySchema,
  updateRestaurantSchema,
  addStaffSchema,
} from "./schemas/restaurantSchema.js";
export { signInSchema } from "./schemas/signInSchema.js";
export { signUpSchema } from "./schemas/signUpSchema.js";
export { forgotPasswordSchema } from "./schemas/forgotPasswordSchema.js";
export { tableSchema } from "./schemas/tableSchema.js";

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
} from "./interfaces/Stats.js";

export { type CurrentSubscription } from "./interfaces/Subscription.js";

export {
  type Table,
  type TableDetails,
  type AllTables,
} from "./interfaces/Table.js";
