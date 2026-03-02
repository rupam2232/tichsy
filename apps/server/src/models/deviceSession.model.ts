// Defines the DeviceSession schema and model for MongoDB using Mongoose
import { Schema, model, Document, Types } from "mongoose";

/**
 * TypeScript interface for a DeviceSession document.
 * Represents a user's session on a specific device.
 */
export interface DeviceSession extends Document {
  userId: Types.ObjectId; // Reference to the User
  deviceId: string; // Unique cookie identifier for the physical device
  ipAddress: string; // IP address of the device
  userAgent: string; // User agent string of the device/browser
  refreshToken?: string; // Refresh token for the session (optional)
  isOnline: boolean; // Indicates if the device currently maintains an active WebSocket connection
  lastActiveAt: Date; // Last activity timestamp
  revoked: boolean; // Whether the session is revoked
  createdAt: Date; // Timestamp when the document was first created (set automatically, never changes)
  updatedAt?: Date; // Timestamp when the document was last updated (set automatically, updates on modification)
}

/**
 * Mongoose schema for the DeviceSession collection.
 */
const deviceSessionSchema: Schema<DeviceSession> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Id of the user is required"],
      immutable: true,
      index: true,
    },
    deviceId: {
      type: String,
      required: [true, "Device id is required"],
      index: true,
    },
    ipAddress: {
      type: String,
      default: "Unknown IP",
      required: [true, "Ip address is required"],
      immutable: true,
    },
    userAgent: {
      type: String,
      default: "Unknown User Agent",
      required: [true, "User agent is required"],
      immutable: true,
    },
    refreshToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
      required: [true, "Last active is required"],
    },
    revoked: {
      type: Boolean,
      default: false,
      required: [true, "Revoked is required"],
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

// Add a TTL index to automatically delete sessions inactive for 60 days (2 months)
deviceSessionSchema.index(
  { lastActiveAt: 1 },
  { expireAfterSeconds: 60 * 24 * 60 * 60 }
);

/**
 * Mongoose model for the DeviceSession schema.
 */
export const DeviceSession = model<DeviceSession>(
  "DeviceSession",
  deviceSessionSchema
);
