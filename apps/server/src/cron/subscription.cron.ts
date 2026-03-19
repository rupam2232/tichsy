import cron from "node-cron";
import { Subscription } from "../models/subscription.model.js";
import { archiveExcessResources } from "../service/archive.service.js";
import { GRACE_PERIOD_DAYS } from "../config/subscriptionPlans.js";
import { subDays, addDays } from "date-fns";
import { createNotification } from "../service/notification.service.js";
import {
  calculateSubscriptionExpiryDate,
  getDaysUntilExpiry,
} from "../utils/subscriptionUtils.js";
import { Types } from "mongoose";

const DEFAULT_TIMEZONE = "Asia/Kolkata";

// Type guard to check if userId is populated
const isPopulatedUser = (
  userId: unknown
): userId is { _id: string; timezone?: string } => {
  return (
    typeof userId === "object" &&
    userId !== null &&
    "_id" in userId &&
    "timezone" in userId
  );
};

/**
 * Notification Cron - Runs once daily at 9:00 AM IST
 * Sends expiry reminders 3 days and 1 day before subscription ends.
 */
const initNotificationCron = () => {
  cron.schedule(
    "0 9 * * *", // 9:00 AM daily
    async () => {
      console.log("Running Subscription Notification Cron...");
      try {
        const now = new Date();

        // Fetch subscriptions ending within the next 4 days
        const fourDaysFromNow = addDays(now, 4);

        const subscriptionsEndingSoon = await Subscription.find({
          isSubscriptionActive: true,
          plan: { $in: ["medium", "pro"] },
          subscriptionEndDate: {
            $gte: now,
            $lte: fourDaysFromNow,
          },
        }).populate<{ userId: { _id: string; timezone?: string } }>(
          "userId",
          "timezone"
        );

        let threeDayCount = 0;
        let oneDayCount = 0;

        for (const sub of subscriptionsEndingSoon) {
          if (!sub.subscriptionEndDate || !sub.userId) continue;

          const userTimezone = isPopulatedUser(sub.userId)
            ? sub.userId.timezone || DEFAULT_TIMEZONE
            : DEFAULT_TIMEZONE;
          const userId = isPopulatedUser(sub.userId)
            ? sub.userId._id
            : (sub.userId as Types.ObjectId).toString();

          const daysUntilExpiry = getDaysUntilExpiry(
            sub.subscriptionEndDate,
            userTimezone
          );

          // 3-day notification
          if (daysUntilExpiry === 3) {
            await createNotification({
              recipient: userId,
              type: "billing",
              title: "Subscription Ending Soon",
              message: `Your ${sub.plan} subscription will expire in 3 days. Renew now to continue enjoying premium features.`,
              data: {
                plan: sub.plan,
                expiryDate: sub.subscriptionEndDate,
              },
              mergeKey: `subscription_expiry_3days_${userId}`,
              expiresAt: addDays(now, 4),
            });
            threeDayCount++;
          }

          // 1-day notification
          if (daysUntilExpiry === 1) {
            await createNotification({
              recipient: userId,
              type: "billing",
              title: "Subscription Ending Tomorrow",
              message: `Your ${sub.plan} subscription will expire tomorrow. Don't lose access to premium features - renew now!`,
              data: {
                plan: sub.plan,
                expiryDate: sub.subscriptionEndDate,
              },
              mergeKey: `subscription_expiry_1day_${userId}`,
              expiresAt: addDays(now, 2),
            });
            oneDayCount++;
          }
        }

        console.log(
          `Sent ${threeDayCount} 3-day and ${oneDayCount} 1-day expiry notifications.`
        );
      } catch (error) {
        console.error("Error in Subscription Notification Cron:", error);
      }
    },
    { timezone: DEFAULT_TIMEZONE }
  );
};

/**
 * Action Cron - Runs twice daily at midnight and noon IST
 * Handles pending plan activations and automatic downgrades.
 */
const initActionCron = () => {
  cron.schedule(
    "0 0,12 * * *", // Midnight and noon
    async () => {
      console.log("Running Subscription Action Cron...");
      try {
        const now = new Date();

        // 1. Activate ALL pending plans where subscription has ended
        const subscriptionsWithPendingPlan = await Subscription.find({
          isSubscriptionActive: true,
          plan: { $in: ["medium", "pro"] },
          subscriptionEndDate: { $lte: now },
          pendingPlan: { $exists: true, $ne: null },
        }).populate<{ userId: { _id: string; timezone?: string } }>(
          "userId",
          "timezone"
        );

        console.log(
          `Found ${subscriptionsWithPendingPlan.length} subscriptions with pending plans to activate.`
        );

        for (const sub of subscriptionsWithPendingPlan) {
          if (sub.pendingPlan) {
            const { plan: pendingPlan, period: pendingPeriod } = sub.pendingPlan;

            const userTimezone = isPopulatedUser(sub.userId)
              ? sub.userId.timezone || DEFAULT_TIMEZONE
              : DEFAULT_TIMEZONE;
            const userId = isPopulatedUser(sub.userId)
              ? sub.userId._id
              : (sub.userId as Types.ObjectId).toString();

            // Activate pending plan
            sub.plan = pendingPlan;
            sub.period = pendingPeriod;
            sub.subscriptionStartDate = now;

            const daysToAdd = pendingPeriod === "yearly" ? 365 : 30;
            sub.subscriptionEndDate = calculateSubscriptionExpiryDate(
              daysToAdd,
              userTimezone
            );

            // Clear pending plan
            sub.pendingPlan = undefined;

            await sub.save({ validateBeforeSave: false });

            // Send notification about plan change
            await createNotification({
              recipient: userId,
              type: "billing",
              title: "Plan Changed",
              message: `Your plan has been successfully changed to ${pendingPlan}. Your new subscription is now active.`,
              data: {
                plan: pendingPlan,
                period: pendingPeriod,
                startDate: now,
                endDate: sub.subscriptionEndDate,
              },
            });

            console.log(
              `Activated pending ${pendingPlan} plan for user: ${userId}`
            );
          }
        }

        // 2. Downgrade expired subscriptions (past grace period, no pending plan)
        const graceExpiredDate = subDays(now, GRACE_PERIOD_DAYS);

        const expiredSubscriptions = await Subscription.find({
          isSubscriptionActive: true,
          plan: { $in: ["medium", "pro"] },
          subscriptionEndDate: { $lte: graceExpiredDate },
          $or: [{ pendingPlan: { $exists: false } }, { pendingPlan: null }],
        });

        console.log(
          `Found ${expiredSubscriptions.length} expired subscriptions to downgrade.`
        );

        for (const sub of expiredSubscriptions) {
          const oldPlan = sub.plan;
          sub.plan = "starter";
          sub.isSubscriptionActive = true;
          sub.period = undefined;
          sub.subscriptionEndDate = undefined;
          sub.subscriptionStartDate = undefined;
          sub.pendingPlan = undefined;
          await sub.save({ validateBeforeSave: false });

          // Send downgrade notification
          await createNotification({
            recipient: sub.userId,
            type: "billing",
            title: "Subscription Downgraded",
            message: `Your ${oldPlan} subscription has expired. Your plan has been downgraded to starter. You can renew anytime to get back your premium features.`,
            data: {
              previousPlan: oldPlan,
              currentPlan: "starter",
            },
          });

          // Trigger archiving logic to enforce starter plan limits
          await archiveExcessResources(sub.userId, "starter");

          console.log(
            `Downgraded expired subscription for user: ${sub.userId} to starter plan`
          );
        }
      } catch (error) {
        console.error("Error in Subscription Action Cron:", error);
      }
    },
    { timezone: DEFAULT_TIMEZONE }
  );
};

/**
 * Initializes all subscription-related cron jobs.
 */
export const initSubscriptionCron = () => {
  console.log("Initializing Subscription Cron Jobs...");
  initNotificationCron();
  initActionCron();
};
