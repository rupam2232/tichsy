// Defines the FoodItem schema and model for MongoDB using Mongoose
import { Schema, model, Document, Types } from "mongoose";

/**
 * TypeScript interface for a FoodVariant subdocument.
 * Represents a specific variant of a food item (e.g., size, flavor).
 */
export interface FoodVariant extends Document {
  variantName: string; // Name/label of the variant (e.g., "Large", "Spicy")
  price: number; // Price for this variant
  description?: string; // Description for this variant
  discountedPrice?: number; // Optional final price after discount for this variant
  isAvailable: boolean; // Whether this variant is currently available
  isDefault: boolean; // Whether this is the default variant
}

/**
 * Mongoose schema for the FoodVariant subdocument.
 */
const foodVariantSchema: Schema<FoodVariant> = new Schema({
  variantName: {
    type: String,
    required: [true, "Variant's name is required"],
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
  },
  description: String,
  discountedPrice: Number,
  isAvailable: {
    type: Boolean,
    default: true,
    required: [true, "Is available is required"],
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
});

export interface AddOnOption extends Document {
  optionName: string;
  price: number;
  isAvailable: boolean;
}

export interface AddOnGroup extends Document {
  groupTitle: string;
  minSelections: number;
  maxSelections: number;
  options: AddOnOption[];
}

const addOnOptionSchema: Schema<AddOnOption> = new Schema({
  optionName: { type: String, required: true },
  price: { type: Number, required: true },
  isAvailable: { type: Boolean, default: true },
});

const addOnGroupSchema: Schema<AddOnGroup> = new Schema({
  groupTitle: { type: String, required: true },
  minSelections: { type: Number, default: 0 },
  maxSelections: { type: Number, default: 1 },
  options: [addOnOptionSchema],
});

/**
 * TypeScript interface for a FoodItem document.
 * Represents a food item in a restaurant's menu, which may have variants.
 */
export interface FoodItem extends Document {
  restaurantId: Types.ObjectId; // Reference to the Restaurant
  foodName: string; // Name of the food item
  price?: number; // Base price of the food item (optional if hasVariants)
  discountedPrice?: number; // Optional final price after discount
  hasVariants: boolean; // Whether this item has variants
  variants: FoodVariant[]; // Array of variants (if any)
  addOnGroups?: AddOnGroup[]; // Future-proofing for Addons/Extras
  imageUrls?: string[]; // Optional array of image URLs
  category?: string; // Optional category (e.g., "Indian", "Snacks")
  foodType: "veg" | "non-veg"; // Type of the food (veg or non-veg)
  description?: string; // Optional description of the food item
  tags?: string[]; // Optional tags for search/filtering (e.g., "Spicy", "Veg")
  isAvailable: boolean; // Whether the item is currently available
  isArchived: boolean; // Whether the item is archived
  archivedAt?: Date; // When the item was archived
  archivedReason?: string; // Reason for archiving
  createdAt: Date; // Timestamp when the document was first created (set automatically, never changes)
  updatedAt?: Date; // Timestamp when the document was last updated (set automatically, updates on modification)
}

/**
 * Mongoose schema for the FoodItem collection.
 */
const foodItemSchema: Schema<FoodItem> = new Schema(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: [true, "Restaurant id is required"],
      immutable: true,
    },
    foodName: {
      type: String,
      required: [true, "Food name is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [
        function (this: FoodItem) {
          return !this.hasVariants;
        },
        "Price of the food is required for items without variants",
      ],
    },
    discountedPrice: Number,
    hasVariants: {
      type: Boolean,
      default: false,
      required: [true, "Has variants is required"],
    },
    variants: {
      type: [foodVariantSchema],
      default: [],
    },
    addOnGroups: {
      type: [addOnGroupSchema],
      default: [],
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    category: String,
    foodType: {
      type: String,
      enum: ["veg", "non-veg"],
      required: [true, "Food type is required"],
    },
    description: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    isAvailable: {
      type: Boolean,
      default: true,
      required: [true, "Is available is required"],
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
 * Compound index to ensure all food names are unique per restaurant.
 * Allows the food name to be used by different restaurants, but only once per restaurant.
 */
foodItemSchema.index({ restaurantId: 1, foodName: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

/**
 * Compound index for efficient querying of food items.
 * Supports filtering by restaurant, archive status, availability, and food name.
 */
foodItemSchema.index({ restaurantId: 1, isArchived: 1, isAvailable: -1, foodName: 1 });

/**
 * Compound index for efficient category-based filtering.
 */
foodItemSchema.index({ restaurantId: 1, category: 1 });

/**
 * Compound index for efficient food type-based filtering.
 */
foodItemSchema.index({ restaurantId: 1, foodType: 1 });

foodItemSchema.pre("save", function (next) {
  if (this.hasVariants) {
    if (!this.variants || this.variants.length === 0) {
      return next(new Error("At least one variant is required when hasVariants is true"));
    }
    // Ensure exactly one variant is default, or if none, set first to true
    let defaultCount = 0;
    for (const variant of this.variants) {
      if (variant.isDefault) {
        defaultCount++;
      }
    }
    if (defaultCount === 0) {
       this.variants[0].isDefault = true;
    } else if (defaultCount > 1) {
       // Just keep the first one found, set rest to false
       let found = false;
       for (const variant of this.variants) {
         if (variant.isDefault) {
           if (found) variant.isDefault = false;
           else found = true;
         }
       }
    }
  }
  next();
});

/**
 * Mongoose model for the FoodItem schema.
 */
export const FoodItem = model<FoodItem>("FoodItem", foodItemSchema);
