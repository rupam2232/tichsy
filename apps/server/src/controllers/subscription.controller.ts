import { Subscription } from "../models/subscription.model.js";
import { SubscriptionHistory } from "../models/subscriptionHistory.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlanHierarchy,
} from "../config/subscriptionPlans.js";
import { razorpay } from "../utils/razorpay.js";
import { createSubscriptionSchema } from "@repo/types";
import { generateSubscriptionReceiptPdf } from "../utils/generateSubscriptionReceiptPdf.js";
import { isValidObjectId } from "mongoose";

export const getSubscriptionDetails = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({
    userId: req.user!._id,
  }).select("-__v -createdAt -updatedAt");
  if (!subscription) {
    throw new ApiError(404, "Subscription not found");
  }
  if (
    subscription.subscriptionEndDate &&
    subscription.subscriptionEndDate < new Date()
  ) {
    subscription.isSubscriptionActive = false;
    subscription.isTrial = false;
    subscription.plan = undefined;
    subscription.subscriptionStartDate = undefined;
    subscription.subscriptionEndDate = undefined;
    await subscription.save({ validateBeforeSave: false });
  }

  if (subscription.isTrial && !subscription.trialExpiresAt) {
    if (
      subscription.subscriptionEndDate &&
      subscription.subscriptionEndDate > new Date()
    ) {
      subscription.isTrial = false;
      await subscription.save({ validateBeforeSave: false });
    } else {
      subscription.isTrial = false;
      subscription.isSubscriptionActive = false;
      subscription.plan = undefined;
      subscription.subscriptionStartDate = undefined;
      subscription.subscriptionEndDate = undefined;
      await subscription.save({ validateBeforeSave: false });
    }
  }
  if (
    subscription.isTrial &&
    subscription.trialExpiresAt &&
    subscription.trialExpiresAt < new Date()
  ) {
    subscription.isSubscriptionActive = false;
    subscription.isTrial = false;
    subscription.plan = undefined;
    subscription.subscriptionStartDate = undefined;
    subscription.subscriptionEndDate = undefined;
    await subscription.save({ validateBeforeSave: false });
  }
  if (
    !subscription.isTrial &&
    !subscription.trialExpiresAt &&
    !subscription.subscriptionEndDate
  ) {
    subscription.isSubscriptionActive = false;
    subscription.plan = undefined;
    subscription.subscriptionStartDate = undefined;
    subscription.subscriptionEndDate = undefined;
    await subscription.save({ validateBeforeSave: false });
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscription,
        "Subscription details fetched successfully"
      )
    );
});

export const createSubscription = asyncHandler(async (req, res) => {
  const validatedData = createSubscriptionSchema.parse(req.body);
  const { plan, period } = validatedData;
  if (!SUBSCRIPTION_PLANS[plan]) {
    throw new ApiError(400, "Invalid plan selected");
  }

  const isYearly = period === "yearly";
  const newPlanPrice = isYearly
    ? SUBSCRIPTION_PLANS[plan].priceYearly
    : SUBSCRIPTION_PLANS[plan].priceMonthly;

  let proratedCredit = 0;
  let action = "create";

  // Check for existing active subscription (Upgrade/Switch scenarios)
  const existingSubscription = await Subscription.findOne({
    userId: req.user!._id,
    isSubscriptionActive: true,
  }).lean();

  if (
    existingSubscription &&
    existingSubscription.plan &&
    existingSubscription.subscriptionEndDate
  ) {
    const currentPlanName = existingSubscription.plan;
    const currentLevel = SubscriptionPlanHierarchy[currentPlanName] || 0;
    const newLevel = SubscriptionPlanHierarchy[plan] || 0;

    if (newLevel < currentLevel) {
      throw new ApiError(
        400,
        "You cannot downgrade your plan while a subscription is active. Please wait for your current subscription to expire"
      );
    }

    if (SUBSCRIPTION_PLANS[currentPlanName]) {
      // Determine old plan price/duration based on stored period or default to monthly
      const oldPeriod = existingSubscription.period || "monthly";
      const oldIsYearly = oldPeriod === "yearly";
      const oldPlanPrice = oldIsYearly
        ? SUBSCRIPTION_PLANS[currentPlanName].priceYearly
        : SUBSCRIPTION_PLANS[currentPlanName].priceMonthly;

      const now = new Date();
      const endDate = new Date(existingSubscription.subscriptionEndDate);

      if (endDate > now) {
        const totalDuration = oldIsYearly ? 365 : 30;
        const oneDay = 24 * 60 * 60 * 1000;
        const remainingDays = Math.ceil(
          (endDate.getTime() - now.getTime()) / oneDay
        );

        if (remainingDays > 0) {
          const dailyRate = oldPlanPrice / totalDuration;
          proratedCredit = Math.floor(remainingDays * dailyRate);
          action = "upgrade"; // or "adjustment"
        }
      }
    }

    if (newLevel === currentLevel) {
      action = "renew";
    }
  }

  // If credit > newPrice, we might set charge to 0.
  const netPayable = Math.max(0, newPlanPrice - proratedCredit);
  // Calculate Fee Recovery (Razorpay Gateway + GST on Fee)
  const platformFeeRate = 0.025; // 2.5%
  // Use toFixed(2) to get precise value, then convert back to number.
  const platformFee = Number((netPayable * platformFeeRate).toFixed(2));
  const totalAmount = netPayable + platformFee;

  const options = {
    amount: Math.round(totalAmount * 100), // amount in paise, rounded to nearest integer
    currency: "INR",
    receipt: `receipt_${Math.random().toString(36).substring(2, 15)}`,
    notes: {
      paymentType: "subscription",
      period: period, // "monthly" or "yearly"
      userId: req.user!._id!.toString(),
      email: req.user!.email,
      plan: String(plan),
      amount: String(totalAmount),
      isUpgrade: String(action === "upgrade"),
      action: action,
      subtotal: String(newPlanPrice),
      discountAmount: String(proratedCredit),
      discountReason:
        action === "upgrade" && proratedCredit > 0 ? "Proration Credit" : "",
      taxAmount: String(platformFee),
    },
  };

  const order = await razorpay.orders.create(options);

  res
    .status(201)
    .json(new ApiResponse(201, order, "Razorpay order created successfully"));
});

export const previewSubscription = asyncHandler(async (req, res) => {
  const validatedData = createSubscriptionSchema.parse(req.body);
  const { plan, period } = validatedData;
  if (!SUBSCRIPTION_PLANS[plan]) {
    throw new ApiError(400, "Invalid plan selected");
  }

  const isYearly = period === "yearly";
  const newPlanPrice = isYearly
    ? SUBSCRIPTION_PLANS[plan].priceYearly
    : SUBSCRIPTION_PLANS[plan].priceMonthly;

  let proratedCredit = 0;
  let action = "create";

  // Check for existing active subscription (Upgrade/Switch scenarios)
  const existingSubscription = await Subscription.findOne({
    userId: req.user!._id,
    isSubscriptionActive: true,
  }).lean();

  if (
    existingSubscription &&
    existingSubscription.plan &&
    existingSubscription.subscriptionEndDate
  ) {
    const currentPlanName = existingSubscription.plan;
    const currentLevel = SubscriptionPlanHierarchy[currentPlanName] || 0;
    const newLevel = SubscriptionPlanHierarchy[plan] || 0;

    if (newLevel < currentLevel) {
      throw new ApiError(
        400,
        "You cannot downgrade your plan while a subscription is active. Please wait for your current subscription to expire."
      );
    }
    if (SUBSCRIPTION_PLANS[currentPlanName]) {
      // Determine old plan price/duration based on stored period or default to monthly
      const oldPeriod = existingSubscription.period || "monthly";
      if (oldPeriod !== "trial") {
        const oldIsYearly = oldPeriod === "yearly";
        const oldPlanPrice = oldIsYearly
          ? SUBSCRIPTION_PLANS[currentPlanName].priceYearly
          : SUBSCRIPTION_PLANS[currentPlanName].priceMonthly;

        const now = new Date();
        const endDate = new Date(existingSubscription.subscriptionEndDate);

        if (endDate > now) {
          const totalDuration = oldIsYearly ? 365 : 30;
          const oneDay = 24 * 60 * 60 * 1000;
          const remainingDays = Math.ceil(
            (endDate.getTime() - now.getTime()) / oneDay
          );

          if (remainingDays > 0) {
            const dailyRate = oldPlanPrice / totalDuration;
            proratedCredit = Math.floor(remainingDays * dailyRate);
            action = "upgrade";
          }
        }
      }
    }

    if (newLevel === currentLevel) {
      action = "renew";
    }
  }

  // If credit > newPrice, we might set charge to 0.
  const netPayable = Math.max(0, newPlanPrice - proratedCredit);
  // Calculate Fee Recovery (Razorpay Gateway + GST on Fee)
  const platformFeeRate = 0.025; // 2.5%
  const platformFee = Number((netPayable * platformFeeRate).toFixed(2));
  const totalAmount = netPayable + platformFee;

  res.status(200).json(
    new ApiResponse(
      200,
      {
        plan,
        period,
        currency: "INR",
        subtotal: newPlanPrice,
        discountAmount: proratedCredit,
        discountReason:
          action === "upgrade" && proratedCredit > 0 ? "Proration Credit" : "",
        taxAmount: platformFee,
        totalAmount,
        action,
      },
      "Subscription preview calculated successfully"
    )
  );
});

export const getSubscriptionHistory = asyncHandler(async (req, res) => {
  const history = await SubscriptionHistory.find({ userId: req.user!._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  res
    .status(200)
    .json(
      new ApiResponse(200, history, "Subscription history fetched successfully")
    );
});

export const downloadReceipt = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const timeZone = (req.query.timezone as string) || "Asia/Kolkata";
  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid receipt ID");
  }

  const subscriptionHistory = await SubscriptionHistory.findById(id);

  if (!subscriptionHistory) {
    throw new ApiError(404, "Receipt not found");
  }

  // Ensure user owns this receipt
  if (subscriptionHistory.userId.toString() !== req.user!.id) {
    throw new ApiError(403, "You do not have permission to view this receipt");
  }

  const userName = [req.user!.firstName, req.user!.lastName]
    .filter(Boolean)
    .join(" ");

  const stream = await generateSubscriptionReceiptPdf(subscriptionHistory, {
    name: userName || req.user!.email,
    email: req.user!.email,
    timeZone,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=receipt-${subscriptionHistory.transactionId || id}.pdf`
  );

  stream.pipe(res);
});
