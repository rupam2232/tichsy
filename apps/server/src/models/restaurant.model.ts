// Defines the Restaurant schema and model for MongoDB using Mongoose
import { Schema, model, Document, Types } from "mongoose";

/**
 * TypeScript interface for a Restaurant document.
 * Represents a restaurant's core information and settings.
 */
export interface Restaurant extends Document {
  _id: Types.ObjectId;
  restaurantName: string; // Full name of the restaurant
  slug: string; // Slug for the restaurant (unique, 3-8 chars)
  logoUrl?: string; // Optional URL to the restaurant's logo
  description?: string; // Optional description of the restaurant
  isCurrentlyOpen: boolean; // Whether the restaurant is currently open
  ownerId: Types.ObjectId; // Reference to the User who owns the restaurant
  staffMembers?: {
    user: Types.ObjectId;
    role: string;
    joinedAt: Date;
  }[]; // Optional array of staff members with their roles
  categories: string[]; // Optional array of categories/cuisines
  openingTime?: string; // Optional opening time (e.g., "09:00")
  closingTime?: string; // Optional closing time (e.g., "22:00")
  taxRate: number; // Number of percentage owner wants to charge for taxes based on the sub total of order value like 5
  taxLabel?: string; // "GST", "VAT"
  isTaxIncludedInPrice: boolean; // Is taxes are already included with all food item's price
  address?: string; // Optional address of restaurant
  isArchived: boolean; // Whether the restaurant is archived
  archivedAt?: Date; // When the restaurant was archived
  archivedReason?: string; // Reason for archiving
  createdAt: Date; // Timestamp when the document was first created (set automatically, never changes)
  updatedAt?: Date; // Timestamp when the document was last updated (set automatically, updates on modification)
}

/**
 * Mongoose schema for the Restaurant collection.
 */
const restaurantSchema: Schema<Restaurant> = new Schema(
  {
    restaurantName: {
      type: String,
      required: [true, "Restaurant name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "A short restaurant name (slug) is required"],
      trim: true,
      unique: true,
      validate: {
        validator: function (str: string) {
          return str.length >= 3 && str.length <= 20;
        },
        message: "Short name (slug) must be 3-20 characters",
      },
    },
    logoUrl: {
      type: String,
    },
    description: String,
    isCurrentlyOpen: {
      type: Boolean,
      required: [true, "Is currently open is required"],
      default: false,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Id of the owner is required"],
      index: true,
    },
    staffMembers: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
          index: true,
        },
        role: {
          type: String,
          required: true,
          default: "staff",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    categories: {
      type: [String],
      default: [],
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: Date,
    archivedReason: String,
    openingTime: String,
    closingTime: String,
    taxRate: {
      type: Number,
      default: 0,
    },
    taxLabel: String,
    isTaxIncludedInPrice: {
      type: Boolean,
      required: [true, "Is tax included in price is required"],
      default: false,
    },
    address: String,
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
 * Compound index to ensure all restaurant names are unique per owner's id.
 * Allows the restaurant name to be used by different owners, but only once per owner id.
 */
restaurantSchema.index({ ownerId: 1, restaurantName: 1 }, { unique: true });

/**
 * Mongoose model for the Restaurant schema.
 */
export const Restaurant = model<Restaurant>("Restaurant", restaurantSchema);
