"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import type { AllFoodItems } from "@repo/types";
import CreateUpdateFoodItem from "@/components/features/menu/create-update-food-item";

export default function AddFoodItemButton({ slug }: { slug: string }) {
  const router = useRouter();
  const activeRestaurant = useSelector(
    (state: RootState) => state.restaurantsSlice.activeRestaurant,
  );

  const [formLoading, setFormLoading] = useState(false);

  const handleAfterCreate: React.Dispatch<
    React.SetStateAction<AllFoodItems | null>
  > = useCallback(() => {
    // Delay router.refresh() slightly so window.history.back() completes first.
    // This ensures data is fetched for the correct route (/menu) instead of (/menu?create=true)
    setTimeout(() => {
      router.refresh();
    }, 50);
  }, [router]);

  if (activeRestaurant?.userRole !== "owner") return null;

  return (
    <CreateUpdateFoodItem
      setAllFoodItems={handleAfterCreate}
      formLoading={formLoading}
      setFormLoading={setFormLoading}
      restaurantSlug={slug}
    />
  );
}
