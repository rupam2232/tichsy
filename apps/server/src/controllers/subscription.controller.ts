import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  SUBSCRIPTION_PLANS,
} from "../config/subscriptionPlans.js";
import { razorpay } from "../utils/razorpay.js";
import {
  createOrUpdateSubscriptionSchema,
  createSubscriptionSchema,
} from "@repo/types";

export const getSubscriptionDetails = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({ userId: req.user!._id });
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

export const createOrUpdateSubscription = asyncHandler(async (req, res) => {
  const {
    plan,
    isTrial,
    trialExpiresAt,
    subscriptionStartDate,
    subscriptionEndDate,
  } = createOrUpdateSubscriptionSchema.parse(req.body);

  const subscription = await Subscription.findOneAndUpdate(
    { userId: req.user!._id },
    {
      plan,
      isTrial,
      trialExpiresAt,
      subscriptionStartDate,
      subscriptionEndDate,
    },
    { new: true, upsert: true }
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscription,
        "Subscription created/updated successfully"
      )
    );
});

export const createSubscription = asyncHandler(async (req, res) => {
  const validatedData = createSubscriptionSchema.parse(req.body);
  const plan = validatedData.plan;
  if (!SUBSCRIPTION_PLANS[plan]) {
    throw new ApiError(400, "Invalid plan selected");
  }

  const amount = SUBSCRIPTION_PLANS[plan].price;

  const options = {
    amount: amount * 100, // amount in the smallest currency unit
    currency: "INR",
    receipt: `receipt_${Math.random().toString(36).substring(2, 15)}`,
    notes: {
      paymentType: "subscription",
      period: "monthly",
      userId: req.user!._id!.toString(),
      email: req.user!.email,
      plan: req.body.plan,
      amount: amount,
    },
  };

  const order = await razorpay.orders.create(options);

  res
    .status(201)
    .json(new ApiResponse(201, order, "Razorpay order created successfully"));
});

export const cancelSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({ userId: req.user!._id });
  if (!subscription) {
    throw new ApiError(404, "Subscription not found");
  }
  await subscription.deleteOne();
  res
    .status(200)
    .json(new ApiResponse(200, null, "Subscription canceled successfully"));
});
