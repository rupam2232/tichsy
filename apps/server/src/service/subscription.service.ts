import { Subscription } from "../models/subscription.model.js";
import { SubscriptionHistory } from "../models/subscriptionHistory.model.js";
import { ApiError } from "../utils/ApiError.js";
import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlanHierarchy,
  SubscriptionPlan,
} from "../config/subscriptionPlans.js";
import {
  calculateSubscriptionExpiryDate,
  extendSubscriptionExpiryDate,
} from "../utils/subscriptionUtils.js";
import {
  checkResourceLimits,
  buildResourceLimitErrorMessage,
} from "./resourceLimits.service.js";
import { io } from "../socket/index.js";
import { createNotification } from "./notification.service.js";
import sendEmail from "../utils/sendEmail.js";
import { subscriptionActivateSuccess } from "../templates/emailTemplates.js";
import { formatInTimeZone } from "date-fns-tz";
import type { ClientSession, Types } from "mongoose";

export interface SubscriptionPricingResult {
  plan: SubscriptionPlan;
  period: "monthly" | "yearly";
  action: "create" | "renew" | "upgrade";
  subtotal: number;
  discountAmount: number;
  discountReason: string;
  taxAmount: number;
  totalAmount: number;
  /** ISO string of the current subscription end date (for renewals) */
  currentEndDate?: string;
}

export interface ActivateSubscriptionParams {
  userId: string | Types.ObjectId;
  plan: SubscriptionPlan;
  period: "monthly" | "yearly";
  action: string;
  /** For renewals: extend from this date instead of starting fresh */
  currentEndDate?: string;
  /** Transaction ID (Razorpay payment ID or free upgrade ID) */
  transactionId: string;
  paymentGateway: string;
  subtotal: number;
  discountAmount: number;
  discountReason: string;
  taxAmount: number;
  totalAmount: number;
  /** MongoDB session for transaction support */
  session: ClientSession;
}

export interface PostActivationParams {
  userId: string;
  plan: string;
  period: string;
  action: string;
  totalAmount: number;
  currency: string;
  transactionId: string;
  user: {
    email: string;
    firstName: string;
    timezone?: string;
  };
}

/**
 * Calculates subscription pricing, including proration for upgrades,
 * determines the action (create/renew/upgrade), and validates resource limits.
 */
export async function calculateSubscriptionPricing(
  userId: string | Types.ObjectId,
  plan: SubscriptionPlan,
  period: "monthly" | "yearly",
): Promise<SubscriptionPricingResult> {
  if (!SUBSCRIPTION_PLANS[plan]) {
    throw new ApiError(400, "Invalid plan selected");
  }

  // Only allow medium and pro plans - starter is free forever and cannot be purchased
  if (plan === "starter") {
    throw new ApiError(
      400,
      "Starter plan cannot be purchased. It is free and automatically assigned",
    );
  }

  const isYearly = period === "yearly";
  const newPlanPrice = isYearly
    ? SUBSCRIPTION_PLANS[plan].priceYearly
    : SUBSCRIPTION_PLANS[plan].priceMonthly;

  let proratedCredit = 0;
  let action: "create" | "renew" | "upgrade" = "create";
  // For renewal: pass the current end date to extend from
  let currentEndDate: string | undefined;

  // Check for existing active subscription (Upgrade/Switch scenarios)
  const existingSubscription = await Subscription.findOne({
    userId: userId,
    isSubscriptionActive: true,
  }).lean();

  if (
    existingSubscription &&
    existingSubscription.plan &&
    existingSubscription.subscriptionEndDate
  ) {
    const now = new Date();
    const endDate = new Date(existingSubscription.subscriptionEndDate);
    const isSubscriptionStillActive = endDate > now;

    // Only apply upgrade/renew logic if subscription is still active (not in grace period)
    if (isSubscriptionStillActive) {
      const currentPlanName = existingSubscription.plan;
      const currentLevel = SubscriptionPlanHierarchy[currentPlanName] || 0;
      const newLevel = SubscriptionPlanHierarchy[plan] || 0;

      // Block downgrades during active subscription
      if (newLevel < currentLevel) {
        throw new ApiError(
          400,
          `You cannot downgrade while your current ${currentPlanName} subscription is active. Please wait until your subscription expires, then purchase the ${plan} plan`,
        );
      }

      // Renewal: same plan, possibly different period
      if (newLevel === currentLevel) {
        action = "renew";
        // Store current end date for the webhook to extend from
        currentEndDate =
          existingSubscription.subscriptionEndDate.toISOString();
      }
      // Upgrade: different (higher) plan - apply proration
      else if (SUBSCRIPTION_PLANS[currentPlanName]) {
        const oldPeriod = existingSubscription.period || "monthly";
        const oldIsYearly = oldPeriod === "yearly";
        const oldPlanPrice = oldIsYearly
          ? SUBSCRIPTION_PLANS[currentPlanName].priceYearly
          : SUBSCRIPTION_PLANS[currentPlanName].priceMonthly;

        const totalDuration = oldIsYearly ? 365 : 30;
        const oneDay = 24 * 60 * 60 * 1000;
        const remainingDays = Math.ceil(
          (endDate.getTime() - now.getTime()) / oneDay,
        );

        if (remainingDays > 0) {
          const dailyRate = oldPlanPrice / totalDuration;
          proratedCredit = Math.floor(remainingDays * dailyRate);
          action = "upgrade";
        }
      }
    }
    // If subscription is expired (grace period), treat as new subscription (action = "create")
  }

  // For new subscriptions (including grace period users), validate resource limits
  if (action === "create") {
    const limitCheck = await checkResourceLimits(userId, plan);
    if (!limitCheck.isWithinLimits) {
      throw new ApiError(400, buildResourceLimitErrorMessage(limitCheck, plan));
    }
  }

  // If credit > newPrice, we might set charge to 0.
  const netPayable = Math.max(0, newPlanPrice - proratedCredit);
  // Calculate Fee Recovery (Razorpay Gateway + GST on Fee)
  const platformFeeRate = 0.025; // 2.5%
  const platformFee = Number((netPayable * platformFeeRate).toFixed(2));
  const totalAmount = netPayable + platformFee;

  return {
    plan,
    period,
    action,
    subtotal: newPlanPrice,
    discountAmount: proratedCredit,
    discountReason:
      action === "upgrade" && proratedCredit > 0 ? "Proration Credit" : "",
    taxAmount: platformFee,
    totalAmount,
    currentEndDate,
  };
}
/**
 * Activates or updates a subscription and creates a history record.
 * Runs within the provided MongoDB session/transaction.
 */
export async function activateSubscription(
  params: ActivateSubscriptionParams,
): Promise<void> {
  const {
    userId,
    plan,
    period,
    action,
    currentEndDate,
    transactionId,
    paymentGateway,
    subtotal,
    discountAmount,
    discountReason,
    taxAmount,
    totalAmount,
    session,
  } = params;

  const daysToAdd = period === "monthly" ? 30 : 365;

  let subscription = await Subscription.findOne({
    userId: userId,
  }).session(session);

  if (subscription) {
    subscription.isSubscriptionActive = true;
    subscription.plan = plan;
    subscription.period = period;

    // For renewals: extend from current end date
    if (action === "renew" && currentEndDate) {
      const baseDate = new Date(currentEndDate);
      subscription.subscriptionEndDate = extendSubscriptionExpiryDate(
        baseDate,
        daysToAdd,
      );
    } else {
      // New subscription or upgrade: start from now
      subscription.subscriptionStartDate = new Date();
      subscription.subscriptionEndDate =
        calculateSubscriptionExpiryDate(daysToAdd);
    }

    await subscription.save({ session });
  } else {
    const [newSubscription] = await Subscription.create(
      [
        {
          userId: userId,
          isSubscriptionActive: true,
          plan: plan,
          period: period,
          subscriptionStartDate: new Date(),
          subscriptionEndDate: calculateSubscriptionExpiryDate(daysToAdd),
        },
      ],
      { session },
    );
    subscription = newSubscription;
  }

  if (!subscription) {
    throw new ApiError(500, "Failed to create or update subscription");
  }

  await SubscriptionHistory.create(
    [
      {
        userId: userId,
        plan: plan,
        period: period,
        subscriptionStartDate: subscription.subscriptionStartDate,
        subscriptionEndDate: subscription.subscriptionEndDate,
        transactionId,
        paymentGateway,
        action: action || "create",
        subtotal,
        discountAmount,
        discountReason,
        taxAmount,
        totalAmount,
      },
    ],
    { session },
  );
}

/**
 * Handles post-activation side effects: socket event, notification, and email.
 * These are non-transactional and run after the DB transaction has committed.
 */
export function handlePostActivationSideEffects(
  params: PostActivationParams,
): void {
  const { userId, plan, period, action, totalAmount, currency, transactionId, user } = params;

  // Emit socket event for the success dialog
  if (io) {
    io.to(`user_${userId}`).emit("subscription_success", {
      plan,
      period,
      amount: totalAmount,
      currency,
      productName: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan (${period})`,
      action: action || "create",
    });
  }

  // Create notification (fire-and-forget)
  const notificationTitle =
    action === "renew"
      ? "Subscription Renewed"
      : action === "upgrade"
        ? "Plan Upgraded"
        : "Subscription Activated";
  const notificationMessage =
    action === "renew"
      ? `Your ${plan} plan has been successfully renewed.`
      : action === "upgrade"
        ? `Your plan has been upgraded to ${plan}.`
        : `Your ${plan} plan has been successfully activated.`;

  createNotification({
    recipient: userId,
    type: "billing",
    title: notificationTitle,
    message: notificationMessage,
    data: { plan, period },
  });

  // Send email (fire-and-forget)
  sendEmail(
    user.email,
    subscriptionActivateSuccess({
      USER_NAME: user.firstName,
      PLAN_NAME: plan,
      AMOUNT: totalAmount.toString(),
      PERIOD: period,
      TRANSACTION_ID: transactionId,
      TRANSACTION_DATE: formatInTimeZone(
        new Date(),
        user.timezone || "Asia/Kolkata",
        "dd MMMM yyyy",
      ),
    }),
  );
}
