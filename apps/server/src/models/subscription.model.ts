// Defines the Subscription schema and model for MongoDB using Mongoose
import { Schema, model, Document, Types } from "mongoose";

/**
 * TypeScript interface for a Subscription document.
 * Represents a user's subscription details, including plan and dates.
 */
export interface Subscription extends Document {
  userId: Types.ObjectId;
  plan?: "starter" | "medium" | "pro";
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  period?: "monthly" | "yearly";
  isSubscriptionActive?: boolean;
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
    isSubscriptionActive: Boolean,
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
