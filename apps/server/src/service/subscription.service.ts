import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlan,
} from "../config/subscriptionPlans.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { type Restaurant as RestaurantType } from "../models/restaurant.model.js";
import { RestaurantMember } from "../models/restaurantMember.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Invitation } from "../models/invitation.model.js";
import { env } from "../env.js";
const isProduction = env.NODE_ENV === "production";

export async function checkStaffLimit(
  restaurant: RestaurantType,
  userId: User["_id"],
  isInvitee: boolean = false
) {
  if (!isProduction) return;

  // Count active (non-archived) staff members from RestaurantMember collection
  const activeStaffCount = await RestaurantMember.countDocuments({
    restaurantId: restaurant._id,
    isArchived: false,
  });

  const pendingInvitesCount = await Invitation.countDocuments({
    restaurantId: restaurant._id,
    status: "pending",
  });

  const staffCount = activeStaffCount + pendingInvitesCount;

  const subscription = await Subscription.findOne({ userId: userId }).lean();
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