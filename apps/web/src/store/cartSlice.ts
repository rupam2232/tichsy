import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
  foodId: string;
  variantName?: string;
  quantity: number;
  foodName: string; // Name of the food item
  price: number; // Base price of the food item
  discountedPrice?: number; // Optional final price after discount
  imageUrl?: string; // Optional array of image URLs
  foodType: "veg" | "non-veg"; // Type of the food (veg or non-veg)
  isAvailable: boolean; // Whether the item is currently available
  description?: string; // Optional description of the food item
  restaurantSlug: string;
}

const initialState: CartItem[] = [];

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      state.push(action.payload);
    },
    removeFromCart: (state, action: PayloadAction<{foodId: string; variantName?: string}>) => {
      return state.filter((item) => item.foodId !== action.payload.foodId || item.variantName !== action.payload.variantName);
    },
    editCartItem: (
      state,
      action: PayloadAction<{ foodId: string; quantity: number; variantName?: string }>
    ) => {
      const { foodId, quantity, variantName } = action.payload;
      const existingItem = state.find((item) => item.foodId === foodId && (variantName ? item.variantName === variantName : (item.variantName === null || item.variantName === undefined)));

      if (existingItem) {
        existingItem.quantity = quantity;
      }
    },
    clearCart: () => {
      return [];
    },
    mergeCartItems: (
      state,
      action: PayloadAction<{
        backendItems: CartItem[];
      }>
    ) => {
      const { backendItems } = action.payload;
      const backendMap = new Map<string, CartItem>();

      backendItems.forEach((item) => {
        const key = item.foodId + (item.variantName || "") + item.restaurantSlug;
        backendMap.set(key, item);
      });

      const merged: CartItem[] = [];
      state.forEach((item) => {
        const key =
          item.foodId + (item.variantName || "") + item.restaurantSlug;
        if (backendMap.has(key)) {
          const existingItem = backendMap.get(key)!;
          merged.push({
            ...existingItem,
            quantity: existingItem.quantity,
          });
          backendMap.delete(key); // Remove from map to avoid duplicates
        }
      });
      // Add remaining items from server that were not in the local state
      backendMap.forEach((item) => {
        merged.push(item);
      });
      // Clear the current state and add merged items
      state.splice(0, state.length, ...merged);
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  editCartItem,
  clearCart,
  mergeCartItems,
} = cartSlice.actions;

export default cartSlice.reducer;
