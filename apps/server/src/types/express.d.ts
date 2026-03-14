import type { User as UserType } from "../models/user.model.js";
import type { Subscription as SubscriptionType } from "../models/subscription.model.js";
import type { Restaurant as RestaurantType } from "../models/restaurant.model.ts";

// Extend Express Request interface to include 'user'
declare module "express-serve-static-core" {
  interface Request {
    user?: UserType;
    subscription?: SubscriptionType | null;
    restaurant?: RestaurantType;
    restaurantRole?: string;
  }
}
