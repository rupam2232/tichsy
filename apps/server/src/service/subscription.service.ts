import { SUBSCRIPTION_PLANS, SubscriptionPlan } from "../config/subscriptionPlans.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { type Restaurant as RestaurantType } from "../models/restaurant.models.js";
import { Subscription } from "../models/subscription.model.js";
import { Coupon } from "../models/coupon.model.js";
import { Invitation } from "../models/invitation.model.js";
import { env } from "../env.js";
const isProduction = env.NODE_ENV === "production";

export async function checkStaffLimit(
  restaurant: RestaurantType,
  userId: User["_id"],
  isInvitee: boolean = false
) {
  if (!isProduction) return;
  const activeStaffCount = restaurant.staffMembers ? restaurant.staffMembers.length : 0;
  
  const pendingInvitesCount = await Invitation.countDocuments({
    restaurantId: restaurant._id,
    status: "pending",
  });

  const staffCount = activeStaffCount + pendingInvitesCount;

  const subscription = await Subscription.findOne({ userId: userId });
  const plan =
    (subscription?.plan as SubscriptionPlan) || ("starter" as SubscriptionPlan);

  const maxStaff = SUBSCRIPTION_PLANS[plan].maxStaffPerRestaurant;

  if (staffCount >= maxStaff) {
    if (isInvitee) {
      throw new ApiError(
        403,
        "This restaurant has reached its maximum staff limit and cannot accept new members at this time"
      );
    } else {
      throw new ApiError(
        403,
        `Your plan allows to add max ${maxStaff} staff members per restaurant. Upgrade to add more`
      );
    }
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
