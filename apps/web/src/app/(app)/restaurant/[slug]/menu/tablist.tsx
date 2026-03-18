"use client";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import type { AxiosError } from "axios";
import axios from "@/utils/axiosInstance";
import type { ApiResponse } from "@repo/types";
import { signOut } from "@/store/authSlice";
import TabHeader from "@/components/shared/tab-header";

export default function TabList({
  slug,
  initialCategories,
}: {
  slug: string;
  initialCategories: string[];
}) {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const [restaurantCategories, setRestaurantCategories] = useState<string[]>(initialCategories);

  const fetchRestaurantCategories = useCallback(async () => {
    // if (isFirstRender.current && initialCategories.length > 0) {
    //   return;
    // }
    if (!slug) {
      toast.error("Restaurant slug is required to fetch categories");
      return;
    }
    try {
      const response = await axios.get(`/restaurant/${slug}/categories`);
      setRestaurantCategories(response.data.data);
    } catch (error) {
      console.error(
        "Failed to fetch all categories. Please try again later:",
        error,
      );
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Failed to fetch all categories. Please try again later",
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push(`/signin?redirect=${pathname}`);
      }
      setRestaurantCategories([]);
    }
  }, [slug, router, dispatch, pathname, initialCategories]);

  return (
    <TabHeader 
    tabs={[
        { value: "all", label: "All" },
        { value: "active", label: "Active" },
        { value: "archived", label: "Archived" },
    ]}
    />
  );
}