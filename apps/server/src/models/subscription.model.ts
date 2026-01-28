// Defines the Subscription schema and model for MongoDB using Mongoose
import { Schema, model, Document, Types } from "mongoose";

/**
 * TypeScript interface for a Subscription document.
 * Represents a user's subscription details, including plan, trial, and dates.
 */
export interface Subscription extends Document {
  userId: Types.ObjectId; // Reference to the User
  plan?: "starter" | "medium" | "pro"; // Subscription plan name
  isTrial: boolean; // Whether the subscription is a trial
  trialExpiresAt?: Date; // When the trial expires
  subscriptionStartDate?: Date; // When the subscription starts
  subscriptionEndDate?: Date; // When the subscription ends
  previousPlan?: "starter" | "medium" | "pro"; // Previous plan before downgrade
  gracePeriodEndsAt?: Date; // When grace period ends
  isOverLimit?: boolean; // Whether the subscription is over the limit
  isSubscriptionActive?: boolean; // Whether the subscription is currently active
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
      required: [true, "Id of the user is required"],
      immutable: true,
    },
    plan: {
      type: String,
      enum: ["starter", "medium", "pro"],
    },
    isTrial: {
      type: Boolean,
      default: false,
      required: [true, "isTrial field is required"],
    },
    trialExpiresAt: {
      type: Date,
    },
    subscriptionStartDate: Date,
    subscriptionEndDate: Date,
    previousPlan: {
      type: String,
      enum: ["starter", "medium", "pro"],
    },
    gracePeriodEndsAt: Date,
    isOverLimit: {
      type: Boolean,
      default: false,
    },
    isSubscriptionActive: Boolean,
  },
  {
    timestamps: true,
  }
);

/**
 * Mongoose model for the Subscription schema.
 */
export const Subscription = model<Subscription>(
  "Subscription",
  subscriptionSchema
);
