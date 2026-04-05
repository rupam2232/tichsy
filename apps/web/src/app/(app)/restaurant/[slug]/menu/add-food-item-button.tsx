"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/store/store";
import { setActiveRestaurant } from "@/store/restaurantSlice";
import type { AllFoodItems } from "@repo/types";
import CreateUpdateFoodItem from "@/components/features/menu/create-update-food-item";

export default function AddFoodItemButton({ slug }: { slug: string }) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const activeRestaurant = useSelector(
    (state: RootState) => state.restaurantsSlice.activeRestaurant,
  );

  const [formLoading, setFormLoading] = useState(false);

  const categories = useMemo(() => activeRestaurant?.categories ?? [], [activeRestaurant]);

  const setCategories = useCallback(
    (updater: React.SetStateAction<string[]>) => {
      if (!activeRestaurant) return;
      const next =
        typeof updater === "function" ? updater(categories) : updater;
      dispatch(setActiveRestaurant({ ...activeRestaurant, categories: next }));
    },
    [activeRestaurant, categories, dispatch],
  );

  const handleAfterCreate: React.Dispatch<
    React.SetStateAction<AllFoodItems | null>
  > = useCallback(() => {
    // Delay router.refresh() slightly so window.history.back() completes first.
    // This ensures data is fetched for the correct route (/menu) instead of (/menu?create=true)
    setTimeout(() => {
      router.refresh();
    }, 200);
  }, [router]);

  if (activeRestaurant?.userRole !== "owner") return null;

  return (
    <CreateUpdateFoodItem
      setAllFoodItems={handleAfterCreate}
      formLoading={formLoading}
      setFormLoading={setFormLoading}
      restaurantSlug={slug}
      categories={categories}
      setCategories={setCategories}
    />
  );
}
