// Defines the Subscription history schema and model for MongoDB using Mongoose
import { Schema, model, Document, Types } from "mongoose";

/**
 * TypeScript interface for a Subscription history document.
 * Represents a user's subscription history details, including plan, trial, and dates.
 */
export interface SubscriptionHistory extends Document {
  userId: Types.ObjectId; // Reference to the User
  plan?: "starter" | "medium" | "pro"; // Subscription plan name
  period: "monthly" | "yearly" | "trial";
  amount: Number; // Payment that user has made
  isTrial: boolean; // Whether the subscription is a trial
  trialExpiresAt?: Date; // When the trial expires
  subscriptionStartDate?: Date; // When the subscription starts
  subscriptionEndDate?: Date; // When the subscription ends
  transactionId?: string; // UPI/Card transaction reference (if any)
  paymentGateway?: string; // Payment gateway used (e.g., "Razorpay", "Stripe")
  action?: "create" | "renew" | "upgrade" | "downgrade";
  subtotal?: number; // Base plan price
  discountAmount?: number; // Total discount (proration + coupons)
  discountReason?: string; // "upgrade", "coupon:CODE", etc.
  taxAmount?: number; // Total tax/fees added (GST + Gateway Fee)
  totalAmount?: number; // Final amount paid
  createdAt: Date; // Timestamp when the document was first created (set automatically, never changes)
  updatedAt?: Date; // Timestamp when the document was last updated (set automatically, updates on modification)
}

/**
 * Mongoose schema for the Subscription history collection.
 */
const subscriptionHistorySchema: Schema<SubscriptionHistory> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Id of the user is required"],
      immutable: true,
    },
    plan: {
      type: String,
      enum: ["starter", "medium", "pro"],
      immutable: true,
    },
    period: {
      type: String,
      enum: ["monthly", "yearly", "trial"],
      default: "monthly",
      immutable: true,
    },
    amount: {
      type: Number,
      default: 0,
      required: [true, "Amount is required"],
      immutable: true,
    },
    isTrial: {
      type: Boolean,
      default: false,
      required: [true, "isTrial field is required"],
      immutable: true,
    },
    trialExpiresAt: {
      type: Date,
      immutable: true,
    },
    subscriptionStartDate: {
      type: Date,
      immutable: true,
    },
    subscriptionEndDate: {
      type: Date,
      immutable: true,
    },
    transactionId: {
      type: String,
      immutable: true,
      unique: true,
    },
    paymentGateway: {
      type: String,
      immutable: true,
    },
    action: {
      type: String,
      enum: ["create", "renew", "upgrade", "downgrade"],
      default: "create",
      immutable: true,
    },
    subtotal: {
      type: Number,
      immutable: true,
    },
    discountAmount: {
      type: Number,
      default: 0,
      immutable: true,
    },
    discountReason: {
      type: String,
      immutable: true,
    },
    taxAmount: {
      type: Number,
      default: 0,
      immutable: true,
    },
    totalAmount: {
      type: Number,
      immutable: true,
    },
    createdAt: {
      type: Date,
      immutable: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Mongoose model for the Subscription history schema.
 */
export const SubscriptionHistory = model<SubscriptionHistory>(
  "SubscriptionHistory",
  subscriptionHistorySchema
);
