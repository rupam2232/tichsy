"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { signOut } from "@/store/authSlice";
import axios from "@/utils/axiosInstance";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { AllFoodItems, ApiResponse } from "@repo/types";
import { Card, CardContent } from "@repo/ui/components/card";
import { cn } from "@repo/ui/lib/utils";
import { FoodImage } from "@/components/shared/food-image";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";
import VegNonVegTooltip from "@/components/shared/veg-nonveg-tooltip";
import FoodDetails from "@/components/features/menu/food-details";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/ui/components/empty";
import { IconToolsKitchen } from "@tabler/icons-react";
import AddFoodItemButton from "./add-food-item-button";

interface MenuListProps {
  initialFoodItems: AllFoodItems | null;
  slug: string;
}

export default function MenuList({ initialFoodItems, slug }: MenuListProps) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "all";
  const search = searchParams.get("search") ?? "";

  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const [allFoodItems, setAllFoodItems] = useState<AllFoodItems | null>(
    initialFoodItems,
  );
  const [isLoading, setIsLoading] = useState<boolean>(initialFoodItems === null);
  const [isPageChanging, setIsPageChanging] = useState<boolean>(false);
  const [tabPages, setTabPages] = useState<Record<string, number>>({ all: 1 });

  const observer = useRef<IntersectionObserver | null>(null);
  const isFirstRender = useRef(true);
  const currentPage = tabPages[tab] ?? 1;

  // Sync fresh server data when router.refresh() is called by AddFoodItemButton
  useEffect(() => {
    if (initialFoodItems) {
      setAllFoodItems(initialFoodItems);
    }
  }, [initialFoodItems]);

  const fetchFoodItems = useCallback(async () => {
    if (isFirstRender.current && initialFoodItems !== null) {
      return;
    }

    if (tab === "search" && search.trim() === "") return;

    try {
      if (currentPage === 1) {
        setIsLoading(true);
        const response = await axios.get<{ data: AllFoodItems }>(
          `/food-item/${slug}`,
          {
            params: {
              limit: 20,
              tab: tab !== "search" ? tab : "",
              search: search.trim(),
              includeArchived: "true",
            },
          },
        );
        if (response.data.data) {
          setAllFoodItems(response.data.data);
        }
      } else {
        setIsPageChanging(true);
        const response = await axios.get<{ data: AllFoodItems }>(
          `/food-item/${slug}`,
          {
            params: {
              page: currentPage,
              limit: 20,
              tab: tab !== "search" ? tab : "",
              search: search.trim(),
              includeArchived: "true",
            },
          },
        );
        if (response.data.data && Array.isArray(response.data.data.foodItems)) {
          const data: AllFoodItems = response.data.data;
          setAllFoodItems((prev) => ({
            ...data,
            foodItems: [...(prev?.foodItems ?? []), ...data.foodItems],
          }));
        }
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ??
          "Failed to fetch food items. Please try again later.",
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push(`/signin?redirect=${pathname}`);
      }
      setAllFoodItems(null);
    } finally {
      setIsLoading(false);
      setIsPageChanging(false);
    }
  }, [slug, tab, search, currentPage, initialFoodItems, dispatch, router, pathname]);

  useEffect(() => {
    fetchFoodItems();
    isFirstRender.current = false;
  }, [fetchFoodItems]);

  // Flush list and reset page when tab changes
  const prevTab = useRef(tab);
  useEffect(() => {
    if (prevTab.current === tab) return;
    prevTab.current = tab;
    setIsLoading(true);
    setAllFoodItems(null);
    setTabPages((prev) => ({ ...prev, [tab]: 1 }));
  }, [tab]);

  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (
          entry?.isIntersecting &&
          allFoodItems &&
          allFoodItems.totalPages > currentPage &&
          allFoodItems.page === currentPage &&
          !isPageChanging
        ) {
          setTabPages((prev) => ({ ...prev, [tab]: (prev[tab] ?? 1) + 1 }));
        }
      });
      if (node) observer.current.observe(node);
    },
    [allFoodItems, currentPage, tab, isPageChanging],
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 @xl/main:grid-cols-3 @3xl/main:grid-cols-4 @5xl/main:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse py-0 gap-0">
            <div className="relative aspect-square">
              <div className="absolute inset-0 bg-muted rounded-t-xl" />
            </div>
            <CardContent className="p-3">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (allFoodItems && allFoodItems.foodItems.length > 0) {
    return (
      <div className="grid grid-cols-2 @xl/main:grid-cols-3 @3xl/main:grid-cols-4 @5xl/main:grid-cols-5 gap-4 animate-in fade-in slide-in-from-top-4 duration-500 pb-8">
        {allFoodItems.foodItems.map((foodItem, index) => (
          <FoodDetails
            key={foodItem._id}
            foodItem={foodItem}
            setAllFoodItems={setAllFoodItems}
            restaurantSlug={slug}
          >
            <Card
              ref={
                index === allFoodItems.foodItems.length - 3
                  ? lastElementRef
                  : null
              }
              className={cn(
                "overflow-hidden transition-all duration-200 hover:scale-101 hover:shadow-md cursor-pointer group py-0 gap-0 relative",
                foodItem.isArchived && "text-accent grayscale-100",
              )}
            >
              <div className="absolute top-2 right-2 z-10">
                <Tooltip>
                  <TooltipTrigger>
                    <span
                      className={cn(
                        "block w-2 h-2 rounded-full",
                        foodItem.isArchived
                          ? "bg-muted-foreground"
                          : foodItem.isAvailable
                            ? "bg-green-500"
                            : "bg-red-500",
                      )}
                    />
                    <span className="sr-only">
                      {foodItem.isArchived
                        ? "Archived"
                        : foodItem.isAvailable
                          ? "Available"
                          : "Not Available"}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {foodItem.isArchived
                      ? "Archived"
                      : foodItem.isAvailable
                        ? "Available"
                        : "Not Available"}
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="absolute top-2 left-2 z-10">
                <VegNonVegTooltip
                  foodType={foodItem.foodType}
                  innerClassName="size-1.5"
                />
              </div>
              <div className="relative aspect-square">
                <FoodImage
                  src={foodItem.imageUrls?.[0]}
                  alt={foodItem.foodName}
                  fill
                  priority={index < 3}
                  draggable={false}
                   sizes="(max-width: 607px) calc(50vw - 24px), (max-width: 799px) calc(33vw - 22px), (max-width: 1071px) calc(25vw - 20px), calc(20vw - 23px)"
                  className="object-cover transition-all duration-200 group-hover:scale-101"
                  fallbackIconClassName="size-8 sm:size-16"
                />
              </div>
              <CardContent className="p-3">
                <div>
                  <h3 className="font-medium line-clamp-1">{foodItem.foodName}</h3>
                  {foodItem.hasVariants ?
                  typeof foodItem.variants?.find(v => v.isDefault)?.discountedPrice === "number" ? (
                    <p className="text-lg font-semibold">
                      ₹{foodItem.variants?.find(v => v.isDefault)?.discountedPrice?.toFixed(2)}
                      <span className="line-through ml-2 text-xs">
                        ₹{(foodItem.variants?.find(v => v.isDefault)?.price || 0).toFixed(2)}
                      </span>
                    </p>
                  ) : (
                    <p className="text-lg font-semibold">
                      ₹{(foodItem.variants?.find(v => v.isDefault)?.price || 0).toFixed(2)}
                    </p>
                  )
                  : typeof foodItem.discountedPrice === "number" &&
                  !isNaN(foodItem.discountedPrice) ? (
                    <p className="text-lg font-semibold">
                      ₹{foodItem.discountedPrice.toFixed(2)}
                      <span className="line-through ml-2 text-xs">
                        ₹{(foodItem.price || 0).toFixed(2)}
                      </span>
                    </p>
                  ) : (
                    <p className="text-lg font-semibold">
                      ₹{(foodItem.price || 0).toFixed(2)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </FoodDetails>
        ))}
        {(isPageChanging || allFoodItems.totalPages > currentPage) &&
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={`loading-more-${i}`} className="animate-pulse py-0 gap-0">
              <div className="relative aspect-square">
                <div className="absolute inset-0 bg-muted rounded-t-xl" />
              </div>
              <CardContent className="p-3">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
      </div>
    );
  }

  return (
    <Empty className="animate-in fade-in slide-in-from-top-4 duration-500 flex items-center justify-center mt-12">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-9">
          <IconToolsKitchen className="size-4" />
        </EmptyMedia>
        <EmptyTitle>No food items found</EmptyTitle>
        <EmptyDescription>
          {tab === "all"
            ? "This restaurant has no food items in menu. Get started by adding the first food item."
            : tab === "search"
              ? "No food items found with this search."
              : "No food items found with this filter."}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <AddFoodItemButton slug={slug} />
      </EmptyContent>
    </Empty>
  );
}
