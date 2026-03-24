export interface FoodVariant {
  _id: string; // Unique identifier for the variant
  variantName: string; // Name/label of the variant (e.g., "Large", "Spicy")
  price: number; // Price for this variant
  description?: string; // Description for this variant
  discountedPrice?: number; // Optional final price after discount for this variant
  isAvailable: boolean; // Whether this variant is currently available
  isDefault?: boolean; // Whether this is the default variant
}

export interface AddOnOption {
  _id: string;
  optionName: string;
  price: number;
  isAvailable: boolean;
}

export interface AddOnGroup {
  _id: string;
  groupTitle: string;
  minSelections: number;
  maxSelections: number;
  options: AddOnOption[];
}

export interface FoodItem {
  _id: string; // Unique identifier for the food item
  foodName: string; // Name of the food item
  price?: number; // Base price of the food item (optional if hasVariants is true)
  discountedPrice?: number; // Optional final price after discount
  imageUrls?: string[]; // Optional array of image URLs
  foodType: "veg" | "non-veg"; // Type of the food (veg or non-veg)
  isAvailable: boolean; // Whether the item is currently available
  isArchived: boolean; // Whether the item is archived
  description?: string; // Optional description of the food item
  hasVariants: boolean; // Whether this item has variants
  createdAt: Date; // Timestamp when the document was first created (set automatically, never changes)
  addOnGroups?: AddOnGroup[]; // Future-proofing for Addons/Extras
  variants?: FoodVariant[]; // Array of variants (if any)
}

export interface FoodItemDetails extends FoodItem {
  tags?: string[]; // Optional tags for search/filtering (e.g., "Spicy", "Veg")
  category?: string; // Optional category (e.g., "Indian", "Snacks")
  restaurantDetails: {
    _id: string; // Unique identifier for the restaurant
    slug: string; // Slug for the restaurant (used in URLs)
    categories: string[];
  };
}

export type AllFoodItems = {
  foodItems: FoodItem[];
  page: number;
  limit: number;
  totalPages: number;
  totalCount: number;
};
