import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import {
  syncCartWithBackend,
  addCartItemToBackend,
  removeCartItemFromBackend,
  editCartItemInBackend,
  clearCartFromBackend,
} from "@/store/cartThunks";
import type { CartItem } from "@/store/cartSlice";
import { useMemo, useCallback } from "react";

export function useCart(restaurantSlug: string) {
  const dispatch = useDispatch<AppDispatch>();
  const cart = useSelector((state: RootState) => state.cart);

  const cartItems = useMemo(
    () => cart.filter((item) => item.restaurantSlug === restaurantSlug),
    [cart, restaurantSlug],
  );

  const syncCart = useCallback(
    () => dispatch(syncCartWithBackend(restaurantSlug)),
    [dispatch, restaurantSlug],
  );

  const addItem = useCallback(
    (item: CartItem) => dispatch(addCartItemToBackend(item)),
    [dispatch],
  );

  const removeItem = useCallback(
    (item: CartItem) => dispatch(removeCartItemFromBackend(item)),
    [dispatch],
  );

  const editItem = useCallback(
    (item: CartItem) => dispatch(editCartItemInBackend(item)),
    [dispatch],
  );

  const clearCart = useCallback(
    () => dispatch(clearCartFromBackend(restaurantSlug)),
    [dispatch, restaurantSlug],
  );

  return {
    cartItems,
    syncCart,
    addItem,
    removeItem,
    editItem,
    clearCart,
  };
}
