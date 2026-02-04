import type { User as UserType } from "../models/user.model.js";
import type { Subscription as SubscriptionType } from "../models/subscription.model.js";


// Extend Express Request interface to include 'user'
declare module "express-serve-static-core" {
  interface Request {
    user?: UserType;
    subscription?: SubscriptionType;
  }
}
