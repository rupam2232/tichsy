import { Schema, model, Document, Types } from "mongoose";

export interface Invitation extends Document {
  email: string; // The invited staff's email
  restaurantId: Types.ObjectId; // Reference to Restaurant
  role: string; // The role assigned to the invited user
  token: string; // Unique, URL-safe generated token
  status: "pending" | "accepted" | "rejected" | "expired";
  invitedBy: Types.ObjectId; // Reference to User (Owner)
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema: Schema<Invitation> = new Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    role: {
      type: String,
      required: true,
      default: "staff",
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "expired"],
      default: "pending",
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

// Compound index to help query invitations for an email per restaurant quickly
invitationSchema.index({ email: 1, restaurantId: 1 });

export const Invitation = model<Invitation>("Invitation", invitationSchema);
