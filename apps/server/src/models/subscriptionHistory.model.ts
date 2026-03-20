// Defines the Subscription history schema and model for MongoDB using Mongoose
import { Schema, model, Document, Types } from "mongoose";

/**
 * TypeScript interface for a Subscription history document.
 * Represents a user's subscription history details, including plan and dates.
 */
export interface SubscriptionHistory extends Document {
  userId: Types.ObjectId;
  plan?: "starter" | "medium" | "pro";
  period?: "monthly" | "yearly";
  amount: number;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  transactionId?: string;
  paymentGateway?: string;
  action?: "create" | "renew" | "upgrade";
  subtotal?: number;
  discountAmount?: number;
  discountReason?: string;
  taxAmount?: number;
  totalAmount?: number;
  createdAt: Date;
  updatedAt?: Date;
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
      index: true,
    },
    plan: {
      type: String,
      enum: ["starter", "medium", "pro"],
      immutable: true,
    },
    period: {
      type: String,
      enum: ["monthly", "yearly"],
      immutable: true,
    },
    amount: {
      type: Number,
      default: 0,
      required: [true, "Amount is required"],
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
      enum: ["create", "renew", "upgrade"],
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
