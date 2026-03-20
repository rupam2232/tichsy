import { Schema, model, Document, Types } from "mongoose";

/**
 * Represents a staff member's association with a restaurant.
 * Owners are NOT stored here - they are identified via Restaurant.ownerId.
 * This model stores only staff/manager relationships.
 */
export interface RestaurantMember extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  restaurantId: Types.ObjectId;
  role: "manager" | "staff";
  joinedAt: Date;
  isArchived: boolean;
  archivedAt?: Date;
  archivedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const restaurantMemberSchema = new Schema<RestaurantMember>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: [true, "Restaurant ID is required"],
    },
    role: {
      type: String,
      enum: {
        values: ["manager", "staff"],
        message: "Role must be either 'manager' or 'staff'",
      },
      required: [true, "Role is required"],
      default: "staff",
    },
    joinedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: Date,
    archivedReason: String,
  },
  {
    timestamps: true,
  }
);

/**
 * Compound unique index ensures a user can only be a member of a restaurant once.
 * This prevents duplicate memberships.
 */
restaurantMemberSchema.index({ userId: 1, restaurantId: 1 }, { unique: true });

/**
 * Index for efficient queries to find all members of a restaurant.
 * Commonly used in staff listing, permission checks, and archive operations.
 */
restaurantMemberSchema.index({ restaurantId: 1, isArchived: 1 });

/**
 * Index for finding all restaurants a user is a member of.
 * Used in "Joined Restaurants" listing.
 */
restaurantMemberSchema.index({ userId: 1, isArchived: 1 });

/**
 * Index for efficient archive queries by joinedAt date.
 * Used during downgrade to archive newest staff members first.
 */
restaurantMemberSchema.index({ restaurantId: 1, isArchived: 1, joinedAt: 1 });

export const RestaurantMember = model<RestaurantMember>(
  "RestaurantMember",
  restaurantMemberSchema
);
