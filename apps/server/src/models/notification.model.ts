// Defines the Notification schema and model for MongoDB using Mongoose
import { Schema, model, Document, Types } from "mongoose";

/**
 * TypeScript interface for a Notification document.
 * Represents a notification sent to a user.
 */
export interface Notification extends Document {
  recipient: Types.ObjectId; // Reference to the User
  type: "order" | "security" | "system"; // type of notification
  title: string; // Title of the notification
  message: string; // Message of the notification
  data?: Record<string, any>; // Metadata like orderId, restaurantId, link
  read: boolean; // Whether the notification has been read
  mergeKey?: string; // Identifier for merging similar notifications
  count: number; // Number of notifications to merge
  expiresAt: Date; // TTL index
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for the Notification collection.
 */
const notificationSchema = new Schema<Notification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["order", "security", "system"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    read: {
      type: Boolean,
      default: false,
    },
    mergeKey: {
      type: String,
    },
    count: {
      type: Number,
      default: 1,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create TTL index on expiresAt
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Mongoose model for the Notification schema.
 */
export const Notification = model<Notification>(
  "Notification",
  notificationSchema
);
