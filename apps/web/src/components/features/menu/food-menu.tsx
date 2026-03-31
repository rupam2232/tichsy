"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { AllFoodItems, FoodItem, Table } from "@repo/types";
import { toast } from "sonner";
import axios from "@/utils/axiosInstance";
import { Card, CardContent } from "@repo/ui/components/card";
import { cn } from "@repo/ui/lib/utils";
import { FoodImage } from "@/components/shared/food-image";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/tabs";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@repo/ui/components/input-group";
import { ScrollArea, ScrollBar } from "@repo/ui/components/scroll-area";
import { Loader2, Minus, Plus, Search, X } from "lucide-react";
import { useDebounceCallback } from "usehooks-ts";
import { Button } from "@repo/ui/components/button";
import CustomerFoodDetails from "./customer-food-details";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { useIsMobile } from "@/hooks/use-mobile";
import VegNonVegTooltip, {
  NonVegIcon,
  VegIcon,
} from "@/components/shared/veg-nonveg-tooltip";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/ui/components/empty";
import { IconToolsKitchen } from "@tabler/icons-react";

const ClinetFoodMenu = ({
  slug,
  tableId,
  isStaffCreatingOrder = false,
  className,
  scrollClassName,
}: {
  slug: string;
  tableId: string | null;
  isStaffCreatingOrder: boolean;
  className?: string;
  scrollClassName?: string;
}) => {
  const [allFoodItems, setAllFoodItems] = useState<AllFoodItems | null>(null);
  const [restaurantCategories, setRestaurantCategories] = useState<string[]>(
    [],
  );
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
  const [isPageChanging, setIsPageChanging] = useState<boolean>(false);
  const [tabName, setTabName] = useState<string>("all");
  const [tabPages, setTabPages] = useState<{ [key: string]: number }>({
    all: 1,
  });
  const [searchInput, setSearchInput] = useState<string>("");
  const [showEditDrawer, setShowEditDrawer] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItem | null>(
    null,
  );
  const isMobile = useIsMobile();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const observer = useRef<IntersectionObserver>(null);
  const debounced = useDebounceCallback(setSearchInput, 300);
  const currentPage = tabPages[tabName] || 1;
  const { cartItems, syncCart, addItem, removeItem, editItem } = useCart(slug);
  const [isTableDataLoading, setIsTableDataLoading] =
    useState<boolean>(!isStaffCreatingOrder);
  const [tableDetails, setTableDetails] = useState<Table | null>(null);

  const fetchFoodItems = useCallback(async () => {
    if (!slug) {
      toast.error("Restaurant slug is required to fetch food items");
      return;
    }
    if (tabName === "search" && searchInput.trim() === "") return;

    try {
      if (currentPage === 1) {
        setIsPageLoading(true);
        const response = await axios.get(
          `/food-item/${slug}?forPage=order&${tabName !== "search" ? `tab=${tabName}` : ""}${
            searchInput.trim() ? `search=${searchInput.trim()}` : ""
          }`,
        );
        setAllFoodItems({ ...response.data.data });
      } else {
        setIsPageChanging(true);
        const response = await axios.get(
          `/food-item/${slug}?page=${currentPage}&tab=${tabName}${
            searchInput.trim() ? `&search=${searchInput.trim()}` : ""
          }`,
        );
        setAllFoodItems((prev) => ({
          ...response.data.data,
          foodItems: [
            ...(prev?.foodItems || []),
            ...response.data.data.foodItems,
          ],
        }));
      }
    } catch (error) {
      console.error(
        "Failed to fetch all foodItems. Please try again later:",
        error,
      );
      setAllFoodItems(null);
    } finally {
      setIsPageChanging(false);
      setIsPageLoading(false);
    }
  }, [slug, tabName, currentPage, searchInput]);

  const fetchRestaurantCategories = useCallback(async () => {
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
      setRestaurantCategories([]);
    }
  }, [slug]);

  const fetchTableDetails = useCallback(async () => {
    if (isStaffCreatingOrder) {
      return;
    }
    if (!tableId) {
      toast.error("Table ID is required to fetch table details");
      setIsTableDataLoading(false);
      setTableDetails(null);
      return;
    }
    setIsTableDataLoading(true);
    try {
      const response = await axios.get(`/table/${slug}/${tableId}`);
      setTableDetails(response.data.data);
    } catch (error) {
      console.error(
        "Failed to fetch table details. Please try again later:",
        error,
      );
    } finally {
      setIsTableDataLoading(false);
    }
  }, [tableId, slug, isStaffCreatingOrder]);

  useEffect(() => {
    if (slug && !isStaffCreatingOrder) {
      syncCart();
    }
    fetchTableDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, fetchTableDetails, isStaffCreatingOrder]);

  useEffect(() => {
    if (isStaffCreatingOrder) {
      fetchFoodItems();
    } else if (tableDetails && tableDetails.isOccupied === false) {
      fetchFoodItems();
    }
  }, [fetchFoodItems, tableDetails, isStaffCreatingOrder]);

  useEffect(() => {
    if (isStaffCreatingOrder) {
      fetchRestaurantCategories();
    } else if (tableDetails && tableDetails.isOccupied === false) {
      fetchRestaurantCategories();
    }
  }, [fetchRestaurantCategories, tableDetails, isStaffCreatingOrder]);

  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries && Array.isArray(entries) && entries[0]?.isIntersecting) {
          if (
            allFoodItems &&
            allFoodItems?.totalPages > currentPage &&
            allFoodItems.page === currentPage
          ) {
            if (isPageChanging) return;
            setTabPages((prev) => ({
              ...prev,
              [tabName]: (prev[tabName] || 1) + 1,
            }));
          }
        }
      });
      if (node) observer.current.observe(node);
    },
    [allFoodItems, currentPage, tabName, isPageChanging],
  );

  useEffect(() => {
    setIsPageLoading(true);
    setAllFoodItems(null);
    setTabPages((prev) => ({
      ...prev,
      [tabName]: 1,
    }));
  }, [tabName]);

  if (isTableDataLoading) {
    return (
      <div
        className={cn(
          "flex flex-col flex-1 items-center justify-center",
          !isStaffCreatingOrder && "min-h-[calc(100vh-(var(--spacing)*16))]",
        )}
      >
        <div
          className={cn("flex items-center gap-2 p-4 text-center", className)}
        >
          <Loader2 className="animate-spin" />
          <p className="animate-pulse text-sm">
            Please wait while we load the table data...
          </p>
        </div>
      </div>
    );
  }

  if (!tableDetails && !isStaffCreatingOrder) {
    return (
      <div
        className={cn(
          "flex flex-col flex-1 items-center justify-center",
          !isStaffCreatingOrder && "min-h-[calc(100vh-(var(--spacing)*16))]",
        )}
      >
        <Empty className="animate-in fade-in slide-in-from-top-4 duration-500 p-0!">
          <EmptyHeader>
            <EmptyTitle>Table not found</EmptyTitle>
            <EmptyDescription>
              Sorry, we couldn&apos;t find your table details. Please refresh
              the page or scan the QR code again.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  if (tableDetails?.isOccupied && !isStaffCreatingOrder) {
    return (
      <div
        className={cn(
          "flex flex-col flex-1 items-center justify-center",
          !isStaffCreatingOrder && "min-h-[calc(100vh-(var(--spacing)*16))]",
        )}
      >
        <Empty className="animate-in fade-in slide-in-from-top-4 duration-500 p-0!">
          <EmptyHeader>
            <EmptyTitle>Table is occupied</EmptyTitle>
            <EmptyDescription>
              Sorry, this table is currently occupied. Please try again later or
              contact restaurant staff for assistance.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative @container/food-menu mb-24",
        { "p-4": !isStaffCreatingOrder },
        className,
      )}
    >
      <Tabs
        defaultValue="all"
        value={tabName}
        onValueChange={(value) => {
          if (searchInputRef.current) {
            searchInputRef.current.value = "";
          }
          setSearchInput("");
          setTabName(value);
        }}
      >
        <div className="flex flex-wrap items-center sm:items-baseline justify-between gap-2">
          <ScrollArea
            className={cn(
              "w-full sm:w-0 flex-1 pb-2 rounded-md",
              scrollClassName,
            )}
          >
            <TabsList>
              <TabsTrigger
                value="all"
                className="font-medium data-[state=active]:font-semibold data-[state=active]:bg-primary! data-[state=active]:text-primary-foreground! data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all duration-200"
                onClick={() => setTabName("all")}
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="veg"
                className="font-medium data-[state=active]:font-semibold data-[state=active]:bg-primary! data-[state=active]:text-primary-foreground! data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all duration-200"
                onClick={() => setTabName("veg")}
              >
                <VegIcon innerClassName="w-[4px] h-[4px]" />
                Veg
              </TabsTrigger>
              <TabsTrigger
                value="non-veg"
                className="font-medium data-[state=active]:font-semibold data-[state=active]:bg-primary! data-[state=active]:text-primary-foreground! data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all duration-200"
                onClick={() => setTabName("non-veg")}
              >
                <NonVegIcon innerClassName="w-[4px] h-[4px]" />
                Non Veg
              </TabsTrigger>
              {restaurantCategories.map((tab, label) => (
                <TabsTrigger
                  key={label}
                  value={tab}
                  className="font-medium data-[state=active]:font-semibold data-[state=active]:bg-primary! data-[state=active]:text-primary-foreground! data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all duration-200"
                  onClick={() => setTabName(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" className="h-2" />
          </ScrollArea>
          <InputGroup className="w-full sm:w-auto sm:min-w-[300px] border-zinc-400 has-[[data-slot=input-group-control]:focus-visible]:border-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-1">
            <InputGroupInput
              type="search"
              placeholder="Search food items by name, category, tags..."
              onChange={(e) => {
                debounced(e.target.value);
                if (e.target.value.trim() === "") {
                  setTabName("all");
                  setSearchInput("");
                } else {
                  setTabName("search");
                }
              }}
              ref={searchInputRef}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (searchInput.trim() === "") {
                    return;
                  }
                  setTabName("search");
                  fetchFoodItems();
                }
              }}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                className={cn(
                  "hover:opacity-100 hover:bg-accent h-6 w-6",
                  searchInputRef.current && searchInputRef.current.value !== ""
                    ? ""
                    : "hidden",
                )}
                onClick={() => {
                  if (searchInputRef.current) {
                    searchInputRef.current.value = "";
                    setSearchInput("");
                    setTabName("all");
                  }
                }}
              >
                <X />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>
        <TabsContent value={tabName} className="mt-2">
          {isPageLoading ? (
            <div
              className={cn("grid grid-cols-2 gap-4 sm:grid-cols-3", {
                "md:grid-cols-4 xl:grid-cols-5": !isStaffCreatingOrder,
              })}
            >
              {Array.from({ length: 4 }).map((_, index) => (
                <Card
                  key={index}
                  className={`animate-pulse py-0 gap-0 ${index > 0 ? `delay-${(index + 1) * 100}` : ""}`}
                >
                  <div className="relative aspect-square">
                    <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-t-xl"></div>
                  </div>
                  <CardContent className="p-3">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : allFoodItems &&
            Array.isArray(allFoodItems.foodItems) &&
            allFoodItems.foodItems.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 @lg/food-menu:grid-cols-3 @3xl/food-menu:grid-cols-4 @5xl/food-menu:grid-cols-5">
              {allFoodItems.foodItems.map((foodItem, index) => (
                <Card
                  key={foodItem._id}
                  ref={
                    index === allFoodItems.foodItems.length - 3
                      ? lastElementRef
                      : null
                  }
                  className={cn(
                    "overflow-hidden transition-all duration-200 hover:scale-101 hover:shadow-md cursor-pointer group py-0 gap-0 relative",
                    !foodItem.isAvailable && "grayscale opacity-80",
                  )}
                  onClick={() => {
                    setSelectedFoodItem(foodItem);
                    setShowEditDrawer(false);
                    setDrawerOpen(true);
                  }}
                >
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
                      fallbackIconClassName="size-8!"
                    />
                  </div>
                  <CardContent className="p-3">
                    <div className="space-y-1">
                      <h3 className="font-semibold line-clamp-1">
                        {foodItem.foodName}
                      </h3>
                      {foodItem.hasVariants ? (
                        <p className="text-sm font-medium">
                          {typeof foodItem.variants?.find((v) => v.isDefault)
                            ?.discountedPrice === "number" ? (
                            <>
                              ₹
                              {foodItem.variants
                                ?.find((v) => v.isDefault)
                                ?.discountedPrice?.toFixed(2)}
                              <span className="line-through ml-2 text-xs text-muted-foreground font-normal">
                                ₹
                                {foodItem.variants
                                  ?.find((v) => v.isDefault)
                                  ?.price?.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <>
                              ₹
                              {foodItem.variants
                                ?.find((v) => v.isDefault)
                                ?.price?.toFixed(2) ||
                                foodItem.variants?.[0]?.price?.toFixed(2)}
                            </>
                          )}
                        </p>
                      ) : typeof foodItem.discountedPrice === "number" ? (
                        <p className="text-sm font-medium">
                          ₹{foodItem.discountedPrice.toFixed(2)}
                          <span className="line-through ml-2 text-xs text-muted-foreground font-normal">
                            ₹{foodItem.price?.toFixed(2)}
                          </span>
                        </p>
                      ) : (
                        <p className="text-sm font-medium">
                          ₹{foodItem.price?.toFixed(2) || "0.00"}
                        </p>
                      )}
                      {foodItem.isAvailable ? (
                        cartItems.some(
                          (item) => item.foodId === foodItem._id,
                        ) ? (
                          <div className="flex items-center justify-between dark:border-zinc-600 border rounded-md w-full">
                            <Button
                              type="button"
                              variant="ghost"
                              className="text-sm h-8 gap-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                const existingItem = cartItems.find(
                                  (item) => item.foodId === foodItem._id,
                                );
                                if (existingItem && foodItem.hasVariants) {
                                  setSelectedFoodItem(foodItem);
                                  setShowEditDrawer(true);
                                  setDrawerOpen(true);
                                } else {
                                  setShowEditDrawer(false);
                                  if (
                                    existingItem &&
                                    existingItem.quantity > 1
                                  ) {
                                    editItem({
                                      ...existingItem,
                                      quantity: existingItem.quantity - 1,
                                    });
                                  } else {
                                    removeItem(existingItem!);
                                  }
                                }
                              }}
                            >
                              <Minus />
                              <span className="sr-only">Remove from cart</span>
                            </Button>
                            <span className="text-sm">
                              {cartItems
                                .filter((item) => item.foodId === foodItem._id)
                                .reduce((acc, item) => acc + item.quantity, 0)}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              className="text-sm h-8 gap-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                const existingItem = cartItems.find(
                                  (item) => item.foodId === foodItem._id,
                                );
                                if (existingItem && foodItem.hasVariants) {
                                  setSelectedFoodItem(foodItem);
                                  setShowEditDrawer(true);
                                  setDrawerOpen(true);
                                } else {
                                  setShowEditDrawer(false);
                                  if (existingItem) {
                                    editItem({
                                      ...existingItem,
                                      quantity: existingItem.quantity + 1,
                                    });
                                  } else {
                                    addItem({
                                      foodId: foodItem._id,
                                      quantity: 1,
                                      foodName: foodItem.foodName,
                                      price: foodItem.price || 0,
                                      discountedPrice: foodItem.discountedPrice,
                                      imageUrl: foodItem.imageUrls?.[0],
                                      foodType: foodItem.foodType,
                                      isAvailable: foodItem.isAvailable,
                                      description: foodItem.description,
                                      restaurantSlug: slug,
                                    });
                                  }
                                }
                              }}
                            >
                              <Plus />
                              <span className="sr-only">Add to cart</span>
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            className="text-sm h-8 gap-0 w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (foodItem.hasVariants) {
                                setSelectedFoodItem(foodItem);
                                setShowEditDrawer(false);
                                setDrawerOpen(true);
                              } else {
                                addItem({
                                  foodId: foodItem._id,
                                  quantity: 1,
                                  foodName: foodItem.foodName,
                                  price: foodItem.price || 0,
                                  discountedPrice: foodItem.discountedPrice,
                                  imageUrl: foodItem.imageUrls?.[0],
                                  foodType: foodItem.foodType,
                                  isAvailable: foodItem.isAvailable,
                                  description: foodItem.description,
                                  restaurantSlug: slug,
                                });
                              }
                            }}
                          >
                            {isMobile ? (
                              <>
                                <Plus /> Add
                              </>
                            ) : (
                              <>
                                <Plus /> Add to Cart
                              </>
                            )}
                          </Button>
                        )
                      ) : (
                        <Button
                          variant="outline"
                          className="text-sm h-8 gap-0 w-full"
                          disabled
                        >
                          Unavailable
                        </Button>
                      )}
                      {foodItem.hasVariants && (
                        <p className="text-[10px] text-muted-foreground text-center absolute bottom-0 sm:left-1/2 sm:-translate-x-1/2 truncate">
                          *Variants available
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {selectedFoodItem && (
                <CustomerFoodDetails
                  foodItem={selectedFoodItem}
                  setAllFoodItems={setAllFoodItems}
                  restaurantSlug={slug}
                  showEditDrawer={showEditDrawer}
                  setDrawerOpen={setDrawerOpen}
                  drawerOpen={drawerOpen}
                />
              )}

              {(isPageChanging || allFoodItems.totalPages !== currentPage) &&
                Array.from({ length: 6 }).map((_, index) => (
                  <Card
                    key={index}
                    className={`animate-pulse py-0 gap-0 ${index > 0 ? `delay-${(index + 1) * 100}` : ""}`}
                  >
                    <div className="relative aspect-square">
                      <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-t-xl"></div>
                    </div>
                    <CardContent className="p-3">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <Empty className="animate-in fade-in slide-in-from-top-4 duration-500 flex items-center justify-center mt-12">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="size-9">
                  <IconToolsKitchen className="size-4" />
                </EmptyMedia>
                <EmptyTitle>No item found</EmptyTitle>
                <EmptyDescription>
                  {searchInput
                    ? "No food item found in the menu with this search"
                    : "No food item found in the menu with this filter"}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </TabsContent>
      </Tabs>
      {!isStaffCreatingOrder && cartItems && cartItems.length > 0 && (
        <Link href={`/${slug}/cart/?tableId=${tableId}`}>
          <Button
            size="lg"
            className="fixed bottom-4 w-[90%] sm:w-1/3 left-1/2 sm:right-4 sm:left-auto -translate-x-1/2 sm:translate-x-0 rounded-md bg-primary z-30"
          >
            View Cart ({cartItems.reduce((acc, item) => acc + item.quantity, 0)}
            )
          </Button>
        </Link>
      )}
    </div>
  );
};

export default ClinetFoodMenu;
