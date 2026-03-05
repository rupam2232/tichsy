"use client";

import { useParams, useSearchParams } from "next/navigation";
import ClientFoodMenu from "@/components/features/menu/food-menu";
import { useEffect, useState } from "react";
import { RestaurantMinimalInfo } from "@repo/types";
import { Loader2 } from "lucide-react";
import { fetchRestaurantMetadata } from "@/utils/fetchRestaurantMetadata";

const MenuClientPage = () => {
  const searchParams = useSearchParams();
  const { slug } = useParams<{ slug: string }>();
  const tableId = searchParams.get("tableId");
  const [restaurantDetails, setRestaurantDetails] =
    useState<RestaurantMinimalInfo | null>(null);
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      const restaurant = await fetchRestaurantMetadata(slug);
      setRestaurantDetails(restaurant);
      setIsPageLoading(false);
    };
    fetchRestaurantDetails();
  }, [slug]);

  if (isPageLoading) {
    return (
      <div className="flex flex-col flex-1 min-h-[calc(100vh-(var(--spacing)*16))] custom-scrollbar overflow-y-auto">
        <div className="flex flex-col items-center justify-center flex-1 px-6">
          <div className="flex items-center gap-2">
            <Loader2 className="animate-spin" />
            <h1 className="text-2xl font-bold">Loading...</h1>
          </div>
          <p className="text-muted-foreground mt-2 text-center">
            Please wait while we load the restaurant details
          </p>
        </div>
      </div>
    );
  }

  if (!restaurantDetails) {
    return (
      <div className="flex flex-col flex-1 min-h-[calc(100vh-(var(--spacing)*16))] custom-scrollbar overflow-y-auto">
        <div className="flex flex-col items-center justify-center flex-1 px-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Restaurant not found</h1>
            <p className="text-muted-foreground mt-2">
              Please try again later when the restaurant is open
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (restaurantDetails.isArchived) {
    return (
      <div className="flex flex-col flex-1 min-h-[calc(100vh-(var(--spacing)*16))] custom-scrollbar overflow-y-auto">
        <div className="flex flex-col items-center justify-center flex-1 px-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Restaurant is closed</h1>
            <p className="text-muted-foreground mt-2">
              Please try again later when the restaurant is open
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!restaurantDetails.isCurrentlyOpen) {
    return (
      <div className="flex flex-col flex-1 min-h-[calc(100vh-(var(--spacing)*16))] custom-scrollbar overflow-y-auto">
        <div className="flex flex-col items-center justify-center flex-1 px-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Restaurant is closed</h1>
            <p className="text-muted-foreground mt-2">
              Please try again later when the restaurant is open
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ClientFoodMenu
      slug={slug}
      tableId={tableId}
      isStaffCreatingOrder={false}
    />
  );
};

export default MenuClientPage;
