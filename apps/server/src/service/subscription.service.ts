import { SUBSCRIPTION_PLANS, SubscriptionPlan } from "../config/subscriptionPlans.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { type Restaurant as RestaurantType } from "../models/restaurant.models.js";
import { Subscription } from "../models/subscription.model.js";
import { Coupon } from "../models/coupon.model.js";
const isProduction = process.env?.NODE_ENV === "production";

export async function checkStaffLimit(
  restaurant: RestaurantType,
  userId: User["_id"]
) {
  if (!isProduction) return;
  const staffCount = restaurant.staffIds ? restaurant.staffIds.length : 0;

  const subscription = await Subscription.findOne({ userId: userId });
  const plan =
    (subscription?.plan as SubscriptionPlan) || ("starter" as SubscriptionPlan);

  const maxStaff = SUBSCRIPTION_PLANS[plan].maxStaffPerRestaurant;

  if (staffCount >= maxStaff) {
    throw new ApiError(
      403,
      `Your plan allows to add max ${maxStaff} staff members per restaurant. Upgrade to add more.`
    );
  }
}

export async function checkCouponLimit(restaurantId: string, user: User) {
  if (!isProduction) return;
  const subscription = await Subscription.findOne({ userId: user._id });
  const plan = (subscription?.plan as SubscriptionPlan) || ("starter" as SubscriptionPlan);

  const maxActiveCoupons = SUBSCRIPTION_PLANS[plan].maxActiveCouponsPerRestaurant;

  const count = await Coupon.countDocuments({
    restaurantId,
    isActive: true,
    isArchived: { $ne: true },
  });

  if (count >= maxActiveCoupons) {
    throw new ApiError(
      403,
      `Plan limit reached: ${maxActiveCoupons} active coupons.`
    );
  }
}
