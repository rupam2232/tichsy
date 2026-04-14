import { Subscription } from "../models/subscription.model.js";
import { SubscriptionHistory } from "../models/subscriptionHistory.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isSubscriptionExpired } from "../config/subscriptionPlans.js";
import { razorpay } from "../utils/razorpay.js";
import { createSubscriptionSchema } from "@repo/types";
import { generateSubscriptionReceiptPdf } from "../utils/generateSubscriptionReceiptPdf.js";
import { isValidObjectId, startSession } from "mongoose";
import {
  calculateSubscriptionPricing,
  activateSubscription,
  handlePostActivationSideEffects,
} from "../service/subscription.service.js";
import crypto from "crypto";

export const getSubscriptionDetails = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({
    userId: req.user!._id,
  }).select("-__v -createdAt -updatedAt");
  if (!subscription) {
    throw new ApiError(404, "Subscription not found");
  }

  // Starter plan is always active - no expiration check needed
  if (subscription.plan === "starter") {
    if (!subscription.isSubscriptionActive) {
      subscription.isSubscriptionActive = true;
      await subscription.save({ validateBeforeSave: false });
    }
  }
  // Paid plans (medium/pro) - check if expired (with grace period)
  else if (isSubscriptionExpired(subscription.subscriptionEndDate)) {
    // Downgrade expired paid subscription to starter
    subscription.isSubscriptionActive = true;
    subscription.plan = "starter";
    subscription.period = undefined;
    subscription.subscriptionStartDate = undefined;
    subscription.subscriptionEndDate = undefined;
    await subscription.save({ validateBeforeSave: false });
  }
  // Edge case: no plan set - set to starter
  else if (!subscription.plan) {
    subscription.isSubscriptionActive = true;
    subscription.plan = "starter";
    subscription.period = undefined;
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

  const pricing = await calculateSubscriptionPricing(
    req.user!._id,
    plan,
    period,
  );

  // If proration credit fully covers the cost, activate directly without Razorpay
  if (pricing.totalAmount === 0) {
    const session = await startSession();
    try {
      session.startTransaction();
      const transactionId = `free_upgrade_${crypto.randomBytes(2).toString("hex")}${Date.now().toString().slice(-4)}`;

      await activateSubscription({
        userId: req.user!._id,
        plan: pricing.plan,
        period: pricing.period,
        action: pricing.action,
        transactionId,
        paymentGateway: "Proration Credit",
        subtotal: pricing.subtotal,
        discountAmount: pricing.discountAmount,
        discountReason: pricing.discountReason,
        taxAmount: pricing.taxAmount,
        totalAmount: pricing.totalAmount,
        session,
      });

      await session.commitTransaction();
      session.endSession();

      handlePostActivationSideEffects({
        userId: req.user!._id!.toString(),
        plan: pricing.plan,
        period: pricing.period,
        action: pricing.action,
        totalAmount: 0,
        currency: "INR",
        transactionId,
        user: {
          email: req.user!.email,
          firstName: req.user!.firstName,
          timezone: req.user!.timezone,
        },
      });

      res.status(200).json(
        new ApiResponse(
          200,
          { freeUpgrade: true },
          "Plan upgraded at no extra cost",
        ),
      );
      return;
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();
      throw error;
    }
  }

  const options = {
    amount: Math.round(pricing.totalAmount * 100), // amount in paise, rounded to nearest integer
    currency: "INR",
    receipt: `receipt_${crypto.randomBytes(4).toString("hex")}`,
    notes: {
      paymentType: "subscription",
      period: period, // "monthly" or "yearly"
      userId: req.user!._id!.toString(),
      email: req.user!.email,
      plan: String(plan),
      totalAmount: String(pricing.totalAmount),
      isUpgrade: String(pricing.action === "upgrade"),
      action: pricing.action,
      subtotal: String(pricing.subtotal),
      discountAmount: String(pricing.discountAmount),
      discountReason: pricing.discountReason,
      taxAmount: String(pricing.taxAmount),
      // For renewals: the webhook will extend from this date
      ...(pricing.currentEndDate && { currentEndDate: pricing.currentEndDate }),
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

  const pricing = await calculateSubscriptionPricing(
    req.user!._id,
    plan,
    period,
  );

  res.status(200).json(
    new ApiResponse(
      200,
      {
        plan: pricing.plan,
        period: pricing.period,
        currency: "INR",
        subtotal: pricing.subtotal,
        discountAmount: pricing.discountAmount,
        discountReason: pricing.discountReason,
        taxAmount: pricing.taxAmount,
        totalAmount: pricing.totalAmount,
        action: pricing.action,
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

export const downloadInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const timeZone =
    (req.query.timezone as string) || req.user?.timezone || "Asia/Kolkata";
  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid invoice ID");
  }

  const subscriptionHistory = await SubscriptionHistory.findById(id);

  if (!subscriptionHistory) {
    throw new ApiError(404, "Invoice not found");
  }

  // Ensure user owns this invoice
  if (subscriptionHistory.userId.toString() !== req.user!.id) {
    throw new ApiError(403, "You do not have permission to view this invoice");
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
    `attachment; filename=invoice-${subscriptionHistory.transactionId || id}.pdf`
  );

  stream.pipe(res);
});
