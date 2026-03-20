import { PlanDisplay, SubscriptionPlan } from "./types";
import { SUBSCRIPTION_PLANS } from "./plans";

/**
 * Format price for display
 */
function formatPrice(price: number): string {
  if (price === 0) return "Free forever";
  return price.toString();
}

/**
 * Marketing copy and feature lists for each plan
 */
export const PLAN_DISPLAYS: Record<SubscriptionPlan, PlanDisplay> = {
  starter: {
    id: "starter",
    title: "Starter",
    description: "Perfect for new ventures & cozy cafes",
    currency: "₹",
    monthlyPrice: formatPrice(SUBSCRIPTION_PLANS.starter.priceMonthly),
    yearlyPrice: formatPrice(SUBSCRIPTION_PLANS.starter.priceYearly),
    buttonText: "Start for Free",
    features: [
      {
        name: "Manage 1 restaurant",
      },
      {
        name: "Up to 10 tables per restaurant",
      },
      {
        name: "20 menu items & 4 categories",
      },
      {
        name: "1 image per menu item",
      },
      {
        name: "Owner-only access (no staff)",
      },
      {
        name: "Take unlimited orders with instant receipts",
      },
      {
        name: "Real-time order notifications & live dashboard",
      },
      {
        name: "30 days of order analytics history",
      },
    ],
  },
  medium: {
    id: "medium",
    title: "Medium",
    description: "Scale your growing restaurant business",
    currency: "₹",
    monthlyPrice: formatPrice(SUBSCRIPTION_PLANS.medium.priceMonthly),
    yearlyPrice: formatPrice(SUBSCRIPTION_PLANS.medium.priceYearly),
    buttonText: "Get Started",
    badge: "Most popular",
    highlight: true,
    features: [
      {
        name: "Manage up to 3 restaurants",
      },
      {
        name: "Up to 30 tables per restaurant",
      },
      {
        name: "100 menu items & 15 categories per restaurant",
      },
      {
        name: "Up to 3 variants per menu item",
      },
      {
        name: "Up to 3 images per menu item",
      },
      {
        name: "Up to 10 staff members per restaurant",
      },
      {
        name: "Take unlimited orders with instant receipts",
      },
      {
        name: "Real-time order notifications & live dashboard",
      },
      {
        name: "90 days of order analytics history",
      },
    ],
  },
  pro: {
    id: "pro",
    title: "Pro",
    description: "Ultimate power for restaurant chains",
    currency: "₹",
    monthlyPrice: formatPrice(SUBSCRIPTION_PLANS.pro.priceMonthly),
    yearlyPrice: formatPrice(SUBSCRIPTION_PLANS.pro.priceYearly),
    buttonText: "Get Started",
    highlight: false,
    features: [
      {
        name: "Manage up to 10 restaurants",
      },
      {
        name: "Unlimited tables per restaurant",
      },
      {
        name: "Unlimited menu items & categories per restaurant",
      },
      {
        name: "Up to 20 variants per menu item",
      },
      {
        name: "Up to 10 images per menu item",
      },
      {
        name: "Up to 50 staff members per restaurant",
      },
      {
        name: "Take unlimited orders with instant receipts",
      },
      {
        name: "Real-time order notifications & live dashboard",
      },
      {
        name: "365 days of order analytics history",
      },
      {
        name: "Priority support",
      },
    ],
  },
};

/**
 * Get all plans as array for display
 */
export function getAllPlans(): PlanDisplay[] {
  return [PLAN_DISPLAYS.starter, PLAN_DISPLAYS.medium, PLAN_DISPLAYS.pro];
}
