import cron from "node-cron";
import { Subscription } from "../models/subscription.model.js";
import { archiveExcessResources } from "../service/archive.service.js";

/**
 * Initializes the subscription check cron job.
 * Runs every day at midnight (00:00).
 */
export const initSubscriptionCron = () => {
  console.log("Initializing Subscription Cron Job...");

  cron.schedule("0 0,12 * * *", async () => {
    console.log("Running Daily Subscription Expiry Check...");
    try {
      const now = new Date();

      // Find active subscriptions that have expired
      const expiredSubscriptions = await Subscription.find({
        isSubscriptionActive: true,
        subscriptionEndDate: { $lte: now },
      });

      console.log(
        `Found ${expiredSubscriptions.length} expired subscriptions.`
      );

      for (const sub of expiredSubscriptions) {
        // Mark as inactive
        sub.isSubscriptionActive = false;
        sub.plan = undefined;
        if (sub.isTrial) sub.isTrial = false;
        sub.trialExpiresAt = undefined;
        sub.subscriptionEndDate = undefined;
        sub.subscriptionStartDate = undefined;
        await sub.save({ validateBeforeSave: false });

        console.log(`Expired subscription for user: ${sub.userId}`);

        // Trigger archiving logic
        // default to 'starter' limits when expired
        await archiveExcessResources(sub.userId, "starter");
      }
    } catch (error) {
      console.error("Error in Subscription Cron Job:", error);
    }
  });
};
