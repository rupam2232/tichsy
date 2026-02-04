import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/utils/axiosInstance";
import {
  mergeCartItems,
  addToCart,
  removeFromCart,
  editCartItem,
  clearCart,
} from "./cartSlice";
import type { CartItem } from "./cartSlice";
import { toast } from "sonner";
import { ApiResponse } from "@repo/types";
import { AxiosError } from "axios";
import { RootState } from "./store";

// Fetch and merge backend cart for a restaurant
export const syncCartWithBackend = createAsyncThunk(
  "cart/syncCartWithBackend",
  async (restaurantSlug: string, { dispatch }) => {
    const response = await axios.get(`/cart/${restaurantSlug}`);
    const backendItems: CartItem[] = response.data.data.items || [];
    dispatch(mergeCartItems({ backendItems }));
    return response.data.data;
  },
);

// Add item to backend and Redux
export const addCartItemToBackend = createAsyncThunk(
  "cart/addCartItemToBackend",
  async (item: CartItem, { dispatch }) => {
    dispatch(addToCart(item));
    try {
      await axios.post(`/cart/${item.restaurantSlug}`, item);
    } catch (error) {
      dispatch(
        removeFromCart({ foodId: item.foodId, variantName: item.variantName }),
      );
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message || "Failed to add item to cart",
      );
    }
  },
);

// Remove item from backend and Redux
export const removeCartItemFromBackend = createAsyncThunk(
  "cart/removeCartItemFromBackend",
  async (item: CartItem, thunkAPI) => {
    const { foodId, restaurantSlug, variantName, quantity } = item;
    thunkAPI.dispatch(removeFromCart({ foodId, variantName }));
    try {
      await axios.delete(`/cart/${restaurantSlug}/${foodId}`, {
        data: { variantName, quantity },
      });
    } catch (error) {
      thunkAPI.dispatch(addToCart(item)); // Re-add item to Redux state
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message || "Failed to remove item from cart",
      );
    }
  },
);

export const editCartItemInBackend = createAsyncThunk(
  "cart/editCartItemInBackend",
  async (item: CartItem, thunkAPI) => {
    const { foodId, restaurantSlug, variantName, quantity } = item;
    const originalItem = thunkAPI.getState() as RootState;

    thunkAPI.dispatch(editCartItem({ foodId, quantity, variantName }));
    try {
      await axios.patch(`/cart/${restaurantSlug}/${foodId}`, {
        variantName,
        quantity,
      });
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message || "Failed to edit item in cart",
      );
      // Revert the change in Redux state
      thunkAPI.dispatch(
        editCartItem({
          foodId,
          quantity:
            originalItem?.cart?.find(
              (item) =>
                item.foodId === foodId && item.variantName === variantName,
            )?.quantity || item.quantity,
          variantName,
        }), // Revert to original quantity
      );
    }
  },
);

export const clearCartFromBackend = createAsyncThunk(
  "cart/clearCart",
  async (restaurantSlug: string, { dispatch }) => {
    try {
      await axios.delete(`/cart/${restaurantSlug}`);
      dispatch(clearCart());
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      console.error("Error clearing cart:", axiosError.response?.data);
      toast.error(axiosError.response?.data.message || "Failed to clear cart");
    }
  },
);
