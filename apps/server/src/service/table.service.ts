import { ApiError } from "../utils/ApiError.js";
import { Table } from "../models/table.model.js";
import type { Subscription as SubscriptionType } from "../models/subscription.model.js";
import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlan,
} from "../config/subscriptionPlans.js";

export async function canCreateTable(
  subscription: SubscriptionType,
  restaurantId: string
) {
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
