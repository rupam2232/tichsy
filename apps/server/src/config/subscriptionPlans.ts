import { addDays, isBefore, isAfter, subDays, startOfDay } from "date-fns";
import {
  GRACE_PERIOD_DAYS,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
  type PlanConfig,
  PlanHierarchy,
} from "@repo/pricing";

// Re-export for backwards compatibility
export type { SubscriptionPlan, PlanConfig };
export { PlanHierarchy as SubscriptionPlanHierarchy, SUBSCRIPTION_PLANS, GRACE_PERIOD_DAYS };

/**
 * Check if subscription has expired (past grace period) and should be downgraded.
 */
export function isSubscriptionExpired(subscriptionEndDate: Date | undefined): boolean {
  if (!subscriptionEndDate) return false;
  const graceEnd = addDays(subscriptionEndDate, GRACE_PERIOD_DAYS);
  return isBefore(graceEnd, new Date());
}

/**
 * Check if subscription is in grace period (expired but not yet downgraded).
 * Use this to show warnings to users about upcoming downgrade.
 */
export function isInGracePeriod(subscriptionEndDate: Date | undefined): boolean {
  if (!subscriptionEndDate) return false;
  const now = new Date();
  const graceEnd = addDays(subscriptionEndDate, GRACE_PERIOD_DAYS);
  return isAfter(now, subscriptionEndDate) && !isAfter(now, graceEnd);
}

/**
 * Get the earliest allowed date for analytics queries based on subscription plan.
 */
export function getAnalyticsHistoryMinDate(plan: SubscriptionPlan): Date {
  const allowedDays = SUBSCRIPTION_PLANS[plan].analyticsHistoryDays;
  return startOfDay(subDays(new Date(), allowedDays));
}

/**
 * Check if a requested date is within the allowed analytics history range for the plan.
 * Returns true if the date is allowed, false if it's too old.
 */
export function isDateWithinAnalyticsHistoryLimit(
  requestedDate: Date,
  plan: SubscriptionPlan
): boolean {
  const minAllowedDate = getAnalyticsHistoryMinDate(plan);
  return !isBefore(requestedDate, minAllowedDate);
}
