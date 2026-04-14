import {
  validatePaymentVerification,
  validateWebhookSignature,
} from "razorpay/dist/utils/razorpay-utils.js";
import { razorpay } from "../utils/razorpay.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { SubscriptionHistory } from "../models/subscriptionHistory.model.js";
import { startSession } from "mongoose";
import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlan,
} from "../config/subscriptionPlans.js";
import { verifyPaymentSchema } from "@repo/types";
import { env } from "../env.js";
import { Payments } from "razorpay/dist/types/payments.js";
import { User } from "../models/user.model.js";
import {
  activateSubscription,
  handlePostActivationSideEffects,
} from "../service/subscription.service.js";

interface RazorpayWebhookBody {
  event: string;
  payload?: {
    payment?: {
      entity?: Payments.RazorpayPayment;
    };
  };
}

const refundPayment = async (
  paymentId: string,
  amount: string | number,
  reason: string
) => {
  try {
    await razorpay.payments.refund(paymentId, {
      amount: amount,
      speed: "normal",
      notes: {
        reason,
      },
    });
  } catch (error) {
    console.error("Error refunding payment:", error);
  }
};

export const razorpayWebhook = asyncHandler(async (req, res, next) => {
  if (!req.body) {
    throw new ApiError(400, "Webhook body is required");
  }

  const session = await startSession();
  try {
    session.startTransaction();
    const webhookSignature = req.get("X-Razorpay-Signature");
    const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSignature || !webhookSecret) {
      throw new ApiError(400, "Webhook signature or secret is missing");
    }
    if (
      !validateWebhookSignature(
        JSON.stringify(req.body),
        webhookSignature,
        webhookSecret
      )
    ) {
      throw new ApiError(400, "Invalid webhook signature");
    }

    const webhookBody = req.body as RazorpayWebhookBody;
    const paymentEntity = webhookBody.payload?.payment?.entity;
    const webhookEvent = webhookBody.event;

    if (!paymentEntity || !webhookEvent) {
      throw new ApiError(400, "Invalid webhook payload");
    }

    if (webhookEvent !== "payment.captured") {
      await session.commitTransaction();
      session.endSession();
      res
        .status(200)
        .json(new ApiResponse(200, null, "Event not relevant for processing"));
      return;
    }

    if (paymentEntity.status !== "captured") {
      throw new ApiError(400, "Payment status is not captured");
    }
    if (paymentEntity.notes?.paymentType !== "subscription") {
      refundPayment(
        paymentEntity.id,
        paymentEntity.amount,
        "Payment received for invalid payment type - refund initiated"
      );
      await session.commitTransaction();
      session.endSession();
      res
        .status(200)
        .json(new ApiResponse(200, null, "Payment type is invalid"));
      return;
    }

    // Fetch order notes (set server-side, tamper-proof)
    const order = await razorpay.orders.fetch(paymentEntity.order_id);
    const orderNotes = order.notes as Record<string, string>;

    const {
      userId,
      plan: planName,
      period: periodNote,
      totalAmount: expectedTotalAmount,
      action,
      taxAmount,
      currentEndDate,
    } = orderNotes;

    if (!userId || !planName) {
      throw new ApiError(400, "Missing userId or plan in payment notes");
    }

    const user = await User.findById(userId)
      .select("email firstName _id timezone")
      .lean();
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const period = periodNote ?? "monthly";
    if (period !== "monthly" && period !== "yearly") {
      refundPayment(
        paymentEntity.id,
        paymentEntity.amount,
        "Payment received for invalid period - refund initiated"
      );
      throw new ApiError(400, "Invalid period selected");
    }
    const plan = planName as SubscriptionPlan;
    if (!SUBSCRIPTION_PLANS[plan]) {
      refundPayment(
        paymentEntity.id,
        paymentEntity.amount,
        "Payment received for invalid plan - refund initiated"
      );
      throw new ApiError(400, "Invalid plan selected");
    }

    // Verification: Checking if paid amount matches the amount calculated earlier and put in notes
    // If notes.totalAmount exists, use it. Otherwise fall back to standard plan price
    let expectedAmountPaise = 0;

    if (expectedTotalAmount) {
      expectedAmountPaise = Math.round(Number(expectedTotalAmount) * 100);
    } else {
      // Fallback if no specific amount in notes (legacy/direct call)
      const basePrice =
        period === "yearly"
          ? SUBSCRIPTION_PLANS[plan].priceYearly
          : SUBSCRIPTION_PLANS[plan].priceMonthly;
      expectedAmountPaise = Math.round(basePrice * 100);
    }

    // Check if the amount paid matches the expected amount exactly
    if (paymentEntity.amount !== expectedAmountPaise) {
      refundPayment(
        paymentEntity.id,
        paymentEntity.amount,
        "Payment amount does not match expected amount - refund initiated"
      );
      throw new ApiError(
        400,
        "Payment amount does not match the plan selected"
      );
    }

    const existingHistory = await SubscriptionHistory.exists({
      transactionId: paymentEntity.id,
    }).session(session);

    if (existingHistory) {
      await session.commitTransaction();
      session.endSession();
      res
        .status(200)
        .json(new ApiResponse(200, null, "Webhook already processed"));
      return;
    }

    await activateSubscription({
      userId,
      plan,
      period: period as "monthly" | "yearly",
      action: action || "create",
      currentEndDate,
      transactionId: paymentEntity.id,
      paymentGateway: "Razorpay",
      subtotal: orderNotes.subtotal ? Number(orderNotes.subtotal) : 0,
      discountAmount: orderNotes.discountAmount
        ? Number(orderNotes.discountAmount)
        : 0,
      discountReason: orderNotes.discountReason || "",
      taxAmount: taxAmount ? Number(taxAmount) : 0,
      totalAmount: paymentEntity.amount / 100,
      session,
    });

    // Commit transaction to save all changes atomically
    await session.commitTransaction();
    session.endSession();

    // Post-activation side effects (socket, notification, email) - non-transactional
    handlePostActivationSideEffects({
      userId,
      plan,
      period,
      action: action || "create",
      totalAmount: paymentEntity.amount / 100,
      currency: paymentEntity.currency,
      transactionId: paymentEntity.id,
      user: {
        email: user.email,
        firstName: user.firstName,
        timezone: user.timezone,
      },
    });

    res
      .status(200)
      .json(new ApiResponse(200, null, "Webhook processed successfully"));
  } catch (error) {
    // Rollback transaction on error
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    next(error);
  }
});

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const validatedData = verifyPaymentSchema.parse(req.body);

  const { paymentId, orderId, signature } = validatedData;

  if (
    !validatePaymentVerification(
      { order_id: orderId, payment_id: paymentId },
      signature,
      env.RAZORPAY_KEY_SECRET
    )
  ) {
    throw new ApiError(400, "Payment verification failed");
  }

      res
        .status(200)
    .json(new ApiResponse(200, true, "Payment verified successfully"));
});
