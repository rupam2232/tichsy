import {
  validatePaymentVerification,
  validateWebhookSignature,
} from "razorpay/dist/utils/razorpay-utils.js";
import { razorpay } from "../utils/razorpay.js";
import { io } from "../socket/index.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Payment } from "../models/payment.model.js";
import { Order } from "../models/order.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subscription } from "../models/subscription.model.js";
import { SubscriptionHistory } from "../models/subscriptionHistory.model.js";
import { startSession } from "mongoose";
import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlan,
} from "../config/subscriptionPlans.js";
import { calculateSubscriptionExpiryDate } from "../utils/subscriptionUtils.js";
import { verifyPaymentSchema } from "@repo/types";
import { createNotification } from "../service/notification.service.js";
import { env } from "../env.js";
import { Payments } from "razorpay/dist/types/payments.js";

interface RazorpayWebhookBody {
  event: string;
  payload?: {
    payment?: {
      entity?: Payments.RazorpayPayment;
    };
  };
}

export const razorpayWebhook = asyncHandler(async (req, res, next) => {
  if (!req.body) {
    throw new ApiError(400, "Webhook body is required");
  }
  // Start a MongoDB session for transaction
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

    if (
      webhookEvent !== "payment.captured" &&
      webhookEvent !== "payment.failed"
    ) {
      await session.commitTransaction();
      session.endSession();
      res
        .status(200)
        .json(new ApiResponse(200, true, "Event not relevant for processing"));
      return;
    } else if (webhookEvent === "payment.captured") {
      if (paymentEntity.status !== "captured") {
        throw new ApiError(400, "Payment status is not captured");
      }
      if (paymentEntity.notes?.paymentType === "subscription") {
        const {
          userId,
          plan: planName,
          period: periodNote,
          amount: expectedTotalAmount,
          action,
          taxAmount,
        } = paymentEntity.notes;

        if (!userId || !planName) {
          throw new ApiError(400, "Missing userId or plan in payment notes");
        }

        const period = periodNote ?? "monthly";
        if (period !== "monthly" && period !== "yearly") {
          throw new ApiError(400, "Invalid period selected");
        }
        const plan = planName as SubscriptionPlan;
        if (!SUBSCRIPTION_PLANS[plan]) {
          throw new ApiError(400, "Invalid plan selected");
        }

        // Verification: Checking if paid amount matches the amount calculated earlier and put in notes
        // If notes.amount exists, use it. Otherwise fall back to standard plan price
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
          razorpay.payments.refund(paymentEntity.id, {
            amount: paymentEntity.amount,
            speed: "optimum",
            notes: {
              reason: "Payment amount does not match the plan selected",
            },
          });
          throw new ApiError(
            400,
            "Payment amount does not match the plan selected"
          );
        }

        const existingHistory = await SubscriptionHistory.findOne({
          transactionId: paymentEntity.id,
        }).session(session);

        if (existingHistory) {
          await session.commitTransaction();
          session.endSession();
          res
            .status(200)
            .json(new ApiResponse(200, true, "Webhook already processed"));
          return;
        }

        let subscription = await Subscription.findOne({
          userId: userId,
        }).session(session);

        if (subscription) {
          subscription.isSubscriptionActive = true;
          subscription.plan = plan;
          subscription.period = period;
          subscription.isTrial = false;
          subscription.trialExpiresAt = undefined;
          subscription.previousPlan = subscription.plan;
          subscription.subscriptionStartDate = new Date();
          subscription.subscriptionEndDate = calculateSubscriptionExpiryDate(
            period === "monthly" ? 30 : 365
          );
          await subscription.save({ session });
        } else {
          const [newSubscription] = await Subscription.create(
            [
              {
                userId: userId,
                isSubscriptionActive: true,
                plan: plan,
                period: period,
                isTrial: false,
                trialExpiresAt: undefined,
                subscriptionStartDate: new Date(),
                subscriptionEndDate: calculateSubscriptionExpiryDate(
                  period === "monthly" ? 30 : 365
                ),
              },
            ],
            { session }
          );
          subscription = newSubscription;
        }

        if (!subscription) {
          throw new ApiError(500, "Failed to create or update subscription");
        }

        await SubscriptionHistory.create(
          [
            {
              userId: subscription.userId,
              plan: subscription.plan,
              period: period,
              amount: paymentEntity.amount / 100,
              isTrial: false,
              subscriptionStartDate: subscription.subscriptionStartDate,
              subscriptionEndDate: subscription.subscriptionEndDate,
              transactionId: paymentEntity.id,
              paymentGateway: "Razorpay",
              action: action || "create",
              subtotal: paymentEntity.notes.subtotal
                ? Number(paymentEntity.notes.subtotal)
                : 0,
              discountAmount: paymentEntity.notes.discountAmount
                ? Number(paymentEntity.notes.discountAmount)
                : 0,
              discountReason: paymentEntity.notes.discountReason,
              taxAmount: taxAmount ? Number(taxAmount) : 0,
              totalAmount: paymentEntity.amount / 100,
            },
          ],
          { session }
        );

        // Emit socket event for real-time notification
        if (io) {
          io.to(`user_${userId}`).emit("subscription_success", {
            plan: plan,
            period: period,
            amount: paymentEntity.amount / 100,
            currency: paymentEntity.currency,
            productName: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan (${period})`,
            action: action || "create",
          });
        }

        await createNotification({
          recipient: userId,
          type: "system",
          title: "Subscription Activated",
          message: `Your ${plan} plan has been successfully activated.`,
          data: {
            paymentId: paymentEntity.id,
            plan,
            period,
          },
        });
      } else if (paymentEntity.notes?.paymentType === "order") {
        const paymentDoc = await Payment.findOne({
          gatewayOrderId: paymentEntity.order_id,
          paymentGateway: "Razorpay",
          status: "pending",
          orderId: paymentEntity.notes.orderId,
        });
        if (!paymentDoc) {
          throw new ApiError(404, "Payment record not found for this order_id");
        }

        const order = await Order.findById(paymentDoc.orderId);
        if (!order) {
          await session.commitTransaction();
          session.endSession();
          res.status(200).json(new ApiResponse(200, true, "Order not found"));
          return;
        } else if (order?.isPaid === true) {
          paymentDoc.status = "paid";
          await paymentDoc.save();
          await session.commitTransaction();
          session.endSession();
          res
            .status(200)
            .json(new ApiResponse(200, true, "Order already paid"));
          return;
        } else {
          if (paymentEntity.status === "captured") {
            paymentDoc.status = "paid";
            paymentDoc.gatewayPaymentId = paymentEntity.id;
            paymentDoc.transactionId =
              paymentEntity.acquirer_data?.upi_transaction_id ||
              paymentEntity.acquirer_data?.rrn;
            await paymentDoc.save();

            // Update order status to paid
            order.isPaid = true;
            await order.save();
          } else if (paymentEntity.status === "failed") {
            paymentDoc.status = "failed";
            await paymentDoc.save();
          }
        }
      }
    }
    // Commit transaction to save all changes atomically
    await session.commitTransaction();
    session.endSession();
    res
      .status(200)
      .json(new ApiResponse(200, true, "Webhook processed successfully"));
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
