// Defines the Subscription schema and model for MongoDB using Mongoose
import { Schema, model, Document, Types } from "mongoose";

/**
 * TypeScript interface for a Subscription document.
 * Represents a user's subscription details, including plan and dates.
 */
export interface Subscription extends Document {
  userId: Types.ObjectId; // Reference to the User
  plan?: "starter" | "medium" | "pro"; // Subscription plan name
  subscriptionStartDate?: Date; // When the subscription starts (paid plans only)
  subscriptionEndDate?: Date; // When the subscription ends (paid plans only)
  period?: "monthly" | "yearly"; // Billing period (only for paid plans, undefined for Starter)
  isOverLimit?: boolean; // Whether the subscription is over the limit
  isSubscriptionActive?: boolean; // Whether the subscription is currently active
  pendingPlan?: {
    plan: "medium" | "pro"; // The plan to activate when current subscription ends
    period: "monthly" | "yearly"; // The billing period for the pending plan
    paidAt: Date; // When the user paid for this pending plan
    transactionId: string; // Payment transaction ID for reference
  };
  createdAt: Date; // Timestamp when the document was first created (set automatically, never changes)
  updatedAt?: Date; // Timestamp when the document was last updated (set automatically, updates on modification)
}

/**
 * Mongoose schema for the Subscription collection.
 */
const subscriptionSchema: Schema<Subscription> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: [true, "User Id is required"],
      immutable: true,
    },
    plan: {
      type: String,
      enum: ["starter", "medium", "pro"],
    },
    period: {
      type: String,
      enum: ["monthly", "yearly"],
    },
    subscriptionStartDate: Date,
    subscriptionEndDate: Date,
    isOverLimit: {
      type: Boolean,
      default: false,
    },
    isSubscriptionActive: Boolean,
    pendingPlan: {
      plan: {
        type: String,
        enum: ["medium", "pro"],
      },
      period: {
        type: String,
        enum: ["monthly", "yearly"],
      },
      paidAt: Date,
      transactionId: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to help query subscriptions for a user quickly
subscriptionSchema.index({ isSubscriptionActive: 1, subscriptionEndDate: 1, plan: 1 });

/**
 * Mongoose model for the Subscription schema.
 */
export const Subscription = model<Subscription>(
  "Subscription",
  subscriptionSchema
);
