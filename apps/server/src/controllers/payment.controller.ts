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
import { calculateSubscriptionExpiryDate, extendSubscriptionExpiryDate } from "../utils/subscriptionUtils.js";
import { verifyPaymentSchema } from "@repo/types";
import { createNotification } from "../service/notification.service.js";
import { env } from "../env.js";
import { Payments } from "razorpay/dist/types/payments.js";
import sendEmail from "../utils/sendEmail.js";
import { subscriptionActivateSuccess } from "../templates/emailTemplates.js";
import { User } from "../models/user.model.js";
import { formatInTimeZone } from "date-fns-tz";

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
          currentEndDate,
        } = paymentEntity.notes;

        if (!userId || !planName) {
          throw new ApiError(400, "Missing userId or plan in payment notes");
        }

        const user = await User.findById(userId)
          .select("email firstName _id")
          .lean();
        if (!user) {
          throw new ApiError(404, "User not found");
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

        const existingHistory = await SubscriptionHistory.exists({
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

        const daysToAdd = period === "monthly" ? 30 : 365;

        // Handle downgrade: store as pending plan instead of immediate activation
        if (action === "downgrade" && subscription) {
          // Store the new plan as pending - will be activated when current subscription ends
          subscription.pendingPlan = {
            plan: plan as "medium" | "pro",
            period: period as "monthly" | "yearly",
            paidAt: new Date(),
            transactionId: paymentEntity.id,
          };
          await subscription.save({ session });

          // Create subscription history record for the scheduled downgrade
          await SubscriptionHistory.create(
            [
              {
                userId: subscription.userId,
                plan: plan,
                period: period,
                amount: paymentEntity.amount / 100,
                // For downgrades, these will be set when the plan activates
                subscriptionStartDate: subscription.subscriptionEndDate, // Starts when current ends
                subscriptionEndDate: extendSubscriptionExpiryDate(
                  subscription.subscriptionEndDate,
                  daysToAdd
                ),
                transactionId: paymentEntity.id,
                paymentGateway: "Razorpay",
                action: "downgrade",
                isScheduled: true, // Mark as scheduled for invoice context
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
              action: "downgrade",
              scheduledActivation: subscription.subscriptionEndDate,
            });
          }

          await createNotification({
            recipient: userId,
            type: "billing",
            title: "Plan Change Scheduled",
            message: `Your ${plan} plan has been scheduled. It will activate when your current subscription ends.`,
            data: {
              paymentId: paymentEntity.id,
              plan,
              period,
              scheduledActivation: subscription.subscriptionEndDate,
            },
          });

          // Send email for scheduled plan change
          sendEmail(
            user.email,
            subscriptionActivateSuccess({
              USER_NAME: user.firstName,
              PLAN_NAME: `${plan} (Scheduled)`,
              AMOUNT: (paymentEntity.amount / 100).toString(),
              PERIOD: period,
              TRANSACTION_ID: paymentEntity.id,
              TRANSACTION_DATE: formatInTimeZone(
                new Date(),
                user.timezone || "Asia/Kolkata",
                "dd MMMM yyyy"
              ),
            })
          );
        } else if (subscription) {
          subscription.isSubscriptionActive = true;
          subscription.plan = plan;
          subscription.period = period;

          // For renewals: extend from current end date instead of starting fresh
          if (action === "renew" && currentEndDate) {
            const baseDate = new Date(currentEndDate);
            subscription.subscriptionEndDate = extendSubscriptionExpiryDate(
              baseDate,
              daysToAdd
            );
            // Keep the original start date for renewals
          } else {
            // New subscription or upgrade: start from now
            subscription.subscriptionStartDate = new Date();
            subscription.subscriptionEndDate = calculateSubscriptionExpiryDate(daysToAdd);
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
            { session }
          );
          subscription = newSubscription;
        }

        if (!subscription) {
          throw new ApiError(500, "Failed to create or update subscription");
        }

        if (action !== "downgrade") {
          await SubscriptionHistory.create(
          [
            {
              userId: subscription.userId,
              plan: subscription.plan,
              period: period,
              amount: paymentEntity.amount / 100,
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
        } 

        if (action !== "downgrade") {
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
            type: "billing",
            title: action === "renew" ? "Subscription Renewed" : "Subscription Activated",
            message: action === "renew"
              ? `Your ${plan} plan has been successfully renewed.`
              : `Your ${plan} plan has been successfully activated.`,
            data: {
              paymentId: paymentEntity.id,
              plan,
              period,
            },
          });

          sendEmail(
            user.email,
            subscriptionActivateSuccess({
              USER_NAME: user.firstName,
              PLAN_NAME: plan,
              AMOUNT: (paymentEntity.amount / 100).toString(),
              PERIOD: period,
              TRANSACTION_ID: paymentEntity.id,
              TRANSACTION_DATE: formatInTimeZone(
                new Date(),
                user.timezone || "Asia/Kolkata",
                "dd MMMM yyyy"
              ),
            })
          );
        }
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
