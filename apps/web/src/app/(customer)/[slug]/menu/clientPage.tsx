"use client";

import { useParams, useSearchParams } from "next/navigation";
import ClientFoodMenu from "@/components/food-menu";
import { useEffect, useState } from "react";
import { RestaurantMinimalInfo } from "@repo/ui/types/Restaurant";
import { fetchRestaurantMetadata } from "@/utils/fetchRestaurantMetadata";
import { Loader2 } from "lucide-react";

const MenuClientPage = () => {
  const searchParams = useSearchParams();
  const { slug } = useParams<{ slug: string }>();
  const tableId = searchParams.get("tableId");
  const [restaurantDetails, setRestaurantDetails] = useState<RestaurantMinimalInfo | null>(null);
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
      <div className="flex flex-col h-full">
        <div className="flex-1 px-6 custom-scrollbar overflow-y-auto">
          <div className="flex flex-col items-center justify-center h-full">
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin" />
              <h1 className="text-2xl font-bold">Loading...</h1>
            </div>
            <p className="text-muted-foreground mt-2">
              Please wait while we load the restaurant details
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!restaurantDetails) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 px-6 custom-scrollbar overflow-y-auto">
          <div className="flex flex-col items-center justify-center h-full">
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
      <div className="flex flex-col h-full">
        <div className="flex-1 px-6 custom-scrollbar overflow-y-auto">
          <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-2xl font-bold">Restaurant is closed</h1>
            <p className="text-muted-foreground mt-2">
              Please try again later when the restaurant is open
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!restaurantDetails.isCurrentlyOpen ) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 px-6 custom-scrollbar overflow-y-auto">
          <div className="flex flex-col items-center justify-center h-full">
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
    <ClientFoodMenu slug={slug} tableId={tableId} isStaffCreatingOrder={false} />
  );
}

export default MenuClientPage;