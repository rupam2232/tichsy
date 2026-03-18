import cron from "node-cron";
import { Subscription } from "../models/subscription.model.js";
import { archiveExcessResources } from "../service/archive.service.js";
import { GRACE_PERIOD_DAYS } from "../config/subscriptionPlans.js";
import { subDays, addDays } from "date-fns";
import { createNotification } from "../service/notification.service.js";
import { calculateSubscriptionExpiryDate } from "../utils/subscriptionUtils.js";

/**
 * Initializes the subscription check cron job.
 * Runs every day at midnight (00:00) and noon (12:00).
 */
export const initSubscriptionCron = () => {
  console.log("Initializing Subscription Cron Job...");

  cron.schedule("*/2 * * * *", async () => {
    console.log("Running Subscription Expiry Check...");
    try {
      const now = new Date();

      // 1. Send notification 3 days before subscription ends
      const threeDAysFromNow = addDays(now, 3);
      const threeDAysStart = subDays(threeDAysFromNow, 1);
      const subscriptionsEndingIn3Days = await Subscription.find({
        isSubscriptionActive: true,
        plan: { $in: ["medium", "pro"] },
        subscriptionEndDate: {
          $gte: threeDAysStart,
          $lte: threeDAysFromNow,
        },
      });

      for (const sub of subscriptionsEndingIn3Days) {
        await createNotification({
          recipient: sub.userId,
          type: "billing",
          title: "Subscription Ending Soon",
          message: `Your ${sub.plan} subscription will expire in 3 days. Renew now to continue enjoying premium features.`,
          data: {
            plan: sub.plan,
            expiryDate: sub.subscriptionEndDate,
          },
          mergeKey: `subscription_expiry_3days_${sub.userId}`,
          expiresAt: addDays(now, 4),
        });
      }

      console.log(
        `Sent 3-day expiry notification to ${subscriptionsEndingIn3Days.length} users.`
      );

      // 2. Send notification 1 day before subscription ends
      const oneDayFromNow = addDays(now, 1);
      const oneDayStart = subDays(oneDayFromNow, 1);
      const subscriptionsEndingIn1Day = await Subscription.find({
        isSubscriptionActive: true,
        plan: { $in: ["medium", "pro"] },
        subscriptionEndDate: {
          $gte: oneDayStart,
          $lte: oneDayFromNow,
        },
      });

      for (const sub of subscriptionsEndingIn1Day) {
        await createNotification({
          recipient: sub.userId,
          type: "billing",
          title: "Subscription Ending Tomorrow",
          message: `Your ${sub.plan} subscription will expire tomorrow. Don't lose access to premium features - renew now!`,
          data: {
            plan: sub.plan,
            expiryDate: sub.subscriptionEndDate,
          },
          mergeKey: `subscription_expiry_1day_${sub.userId}`,
          expiresAt: addDays(now, 2),
        });
      }

      console.log(
        `Sent 1-day expiry notification to ${subscriptionsEndingIn1Day.length} users.`
      );

      // 3. Calculate the date that marks the end of grace period
      // subscriptionEndDate + GRACE_PERIOD_DAYS <= now
      // means subscriptionEndDate <= now - GRACE_PERIOD_DAYS
      const graceExpiredDate = subDays(now, GRACE_PERIOD_DAYS);

      // Find active paid subscriptions (medium/pro) that have expired past grace period
      const expiredSubscriptions = await Subscription.find({
        isSubscriptionActive: true,
        plan: { $in: ["medium", "pro"] },
        subscriptionEndDate: { $lte: graceExpiredDate },
      });

      console.log(
        `Found ${expiredSubscriptions.length} expired paid subscriptions.`
      );

      // 4. Also check for subscriptions that just ended (not past grace yet) to handle pending plans
      const subscriptionsJustEnded = await Subscription.find({
        isSubscriptionActive: true,
        plan: { $in: ["medium", "pro"] },
        subscriptionEndDate: {
          $gte: subDays(now, 1),
          $lte: now,
        },
        pendingPlan: { $exists: true },
      });

      for (const sub of subscriptionsJustEnded) {
        if (sub.pendingPlan) {
          const { plan: pendingPlan, period: pendingPeriod } = sub.pendingPlan;

          // Activate pending plan
          sub.plan = pendingPlan;
          sub.period = pendingPeriod;
          sub.subscriptionStartDate = now;

          const daysToAdd = pendingPeriod === "yearly" ? 365 : 30;
          sub.subscriptionEndDate = calculateSubscriptionExpiryDate(daysToAdd);

          // Clear pending plan
          sub.pendingPlan = undefined;

          await sub.save({ validateBeforeSave: false });

          // Send notification about plan change
          await createNotification({
            recipient: sub.userId,
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
            `Activated pending ${pendingPlan} plan for user: ${sub.userId}`
          );
        }
      }

      for (const sub of expiredSubscriptions) {
        // Downgrade to starter plan (keep active)
        const oldPlan = sub.plan;
        sub.plan = "starter";
        sub.isSubscriptionActive = true;
        sub.period = undefined;
        sub.subscriptionEndDate = undefined;
        sub.subscriptionStartDate = undefined;
        sub.pendingPlan = undefined; // Clear any pending plan as well
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

        console.log(
          `Downgraded expired subscription for user: ${sub.userId} to starter plan`
        );

        // Trigger archiving logic to enforce starter plan limits
        await archiveExcessResources(sub.userId, "starter");
      }
    } catch (error) {
      console.error("Error in Subscription Cron Job:", error);
    }
  }, {
    timezone: "Asia/Kolkata",
  });
};
