import { ApiError } from "../utils/ApiError.js";
import { Table } from "../models/table.model.js";
import type { Subscription as SubscriptionType } from "../models/subscription.model.js";
import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlan,
} from "../config/subscriptionPlans.js";
import { env } from "../env.js";

const isProduction = env.NODE_ENV === "production";

export async function canCreateTable(
  subscription: SubscriptionType,
  restaurantId: string
) {
  if (!isProduction) return;
  const totalTableCount = await Table.countDocuments({ restaurantId });

  const plan =
    (subscription?.plan as SubscriptionPlan) || ("starter" as SubscriptionPlan);

  const maxTables = SUBSCRIPTION_PLANS[plan].maxTablesPerRestaurant;

  if (totalTableCount >= maxTables) {
    throw new ApiError(
      403,
      `Your plan allows to create max ${maxTables} tables per restaurant. Upgrade to create more.`
    );
  }
}

export async function canUnarchiveTable(
  subscription: SubscriptionType,
  restaurantId: string
) {
  if (!isProduction) return;
  const activeTableCount = await Table.countDocuments({
    restaurantId,
    isArchived: false,
  });

  const plan =
    (subscription?.plan as SubscriptionPlan) || ("starter" as SubscriptionPlan);

  const maxTables = SUBSCRIPTION_PLANS[plan].maxTablesPerRestaurant;

  if (activeTableCount >= maxTables) {
    throw new ApiError(
      403,
      `Your plan allows max ${maxTables} active tables per restaurant. Upgrade your plan or archive another table to unarchive this one`
    );
  }
}
