// Defines the Cart schema and model for MongoDB using Mongoose
import { Schema, model, Document, Types } from "mongoose";

export interface SelectedAddOn extends Document {
  groupTitle: string;
  optionName: string;
  price: number;
}

const selectedAddOnSchema: Schema<SelectedAddOn> = new Schema({
  groupTitle: { type: String, required: true },
  optionName: { type: String, required: true },
  price: { type: Number, required: true },
});

/**
 * TypeScript interface for a Cart document.
 * Represents a shopping cart for a restaurant, including items and expiration.
 */
export interface CartItem extends Document {
  restaurantSlug: string; // Slug of the restaurant this cart belongs to
  foodId: Types.ObjectId; // Reference to the Food item
  quantity: number; // Quantity of this food item in the cart
  variantName?: string; // Optional variant name (e.g., "Large", "Spicy")
  selectedAddOns?: SelectedAddOn[]; // Snapshot of selected addons
}

const cartItemSchema: Schema<CartItem> = new Schema({
  restaurantSlug: {
    type: String,
    required: [true, "Restaurant slug is required"],
    trim: true,
  },
  foodId: { type: Schema.Types.ObjectId, required: true, ref: "FoodItem" },
  quantity: { type: Number, required: true, min: 1 },
  variantName: { type: String, default: null },
  selectedAddOns: {
    type: [selectedAddOnSchema],
    default: [],
  },
}, {
  timestamps: true,
});

export interface Cart extends Document {
  items: CartItem[];
  expiresAt: Date; // Expiration date for the cart, after which it is considered invalid
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Mongoose schema for the Cart collection.
 * Stores all cart-related information for a restaurant.
 */
const cartSchema: Schema<Cart> = new Schema(
  {
    items: {
      type: [cartItemSchema],
      default: [],
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default expiration is 7 days from creation
      required: [true, "Expires at is required"],
      index: { expires: 0 }, // TTL Index: Deletes document after `expiresAt`
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Mongoose model for the Cart schema.
 */
export const Cart = model<Cart>("Cart", cartSchema);
