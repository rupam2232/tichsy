"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { AllFoodItems } from "@repo/ui/types/FoodItem";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { signOut } from "@/store/authSlice";
import { useRouter, usePathname } from "next/navigation";
import type { AxiosError } from "axios";
import type { ApiResponse } from "@repo/ui/types/ApiResponse";
import axios from "@/utils/axiosInstance";
import type { AppDispatch, RootState } from "@/store/store";
import { Card, CardContent, CardFooter } from "@repo/ui/components/card";
import Image from "next/image";
import { cn } from "@repo/ui/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";
import FoodDetails from "@/components/food-details";
import { IconSalad } from "@tabler/icons-react";
import CreateUpdateFoodItem from "@/components/create-update-foodItem";
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
import { Search, X } from "lucide-react";
import { useDebounceCallback } from "usehooks-ts";
import VegNonVegTooltip from "@/components/veg-nonveg-tooltip";

const MenuPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [allFoodItems, setAllFoodItems] = useState<AllFoodItems | null>(null);
  const [restaurantCategories, setRestaurantCategories] = useState<string[]>(
    []
  );
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
  const [isPageChanging, setIsPageChanging] = useState<boolean>(false);
  const [tabName, setTabName] = useState<string>("all");
  const [tabPages, setTabPages] = useState<{ [key: string]: number }>({
    all: 1,
  });
  const [searchInput, setSearchInput] = useState<string>("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const observer = useRef<IntersectionObserver>(null);
  const user = useSelector((state: RootState) => state.auth.user);
  const debouncedSearchInput = useDebounceCallback(setSearchInput, 300);
  const currentPage = tabPages[tabName] || 1;
  const pathname = usePathname();

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
          `/food-item/${slug}?${tabName !== "search" ? `tab=${tabName}` : ""}${
            searchInput.trim() ? `search=${searchInput.trim()}` : ""
          }`
        );
        setAllFoodItems({ ...response.data.data });
      } else {
        setIsPageChanging(true);
        const response = await axios.get(
          `/food-item/${slug}?page=${currentPage}&tab=${tabName}${
            searchInput.trim() ? `&search=${searchInput.trim()}` : ""
          }`
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
        error
      );
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Failed to fetch all food items. Please try again later"
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push(`/signin?redirect=${pathname}`);
      }
      setAllFoodItems(null);
    } finally {
      setIsPageChanging(false);
      setIsPageLoading(false);
    }
  }, [slug, router, dispatch, tabName, currentPage, searchInput, pathname]);

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
        error
      );
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Failed to fetch all categories. Please try again later"
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push(`/signin?redirect=${pathname}`);
      }
      setRestaurantCategories([]);
    }
  }, [slug, router, dispatch, pathname]);

  useEffect(() => {
    fetchRestaurantCategories();
  }, [fetchRestaurantCategories]);

  useEffect(() => {
    fetchFoodItems();
  }, [fetchFoodItems]);

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
    [allFoodItems, currentPage, tabName, isPageChanging]
  );

  useEffect(() => {
    setIsPageLoading(true);
    setAllFoodItems(null);
    setTabPages((prev) => ({
      ...prev,
      [tabName]: 1,
    }));
  }, [tabName]);

  return (
    <div className="p-4">
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
        <div className="flex flex-wrap items-center sm:items-start justify-between gap-2">
          <ScrollArea className="w-full sm:w-0 flex-1 pb-2 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-md">
            <TabsList>
              <TabsTrigger
                value="all"
                className="font-medium data-[state=active]:font-semibold data-[state=active]:bg-primary! data-[state=active]:text-primary-foreground! data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all duration-200"
                onClick={() => setTabName("all")}
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="available"
                className="font-medium data-[state=active]:font-semibold data-[state=active]:bg-primary! data-[state=active]:text-primary-foreground! data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all duration-200"
                onClick={() => setTabName("available")}
              >
                Available
              </TabsTrigger>
              <TabsTrigger
                value="unavailable"
                className="font-medium data-[state=active]:font-semibold data-[state=active]:bg-primary! data-[state=active]:text-primary-foreground! data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all duration-200"
                onClick={() => setTabName("unavailable")}
              >
                Unavailable
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
              placeholder="Search food items by name, category, tags..."
              type="search"
              onChange={(e) => {
                debouncedSearchInput(e.target.value);
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
                  if (searchInputRef.current?.value.trim() === "") {
                    toast.error("Search input cannot be empty");
                    return;
                  }
                  debouncedSearchInput.cancel();
                  setTabName("search");
                  setSearchInput(searchInputRef.current?.value || "");
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
                    : "hidden"
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

          {(isPageLoading ||
            isPageChanging ||
            tabName !== "all" ||
            (allFoodItems &&
              Array.isArray(allFoodItems.foodItems) &&
              allFoodItems.foodItems.length > 0 &&
              user?.role === "owner")) && (
            <div className="flex justify-end">
              <CreateUpdateFoodItem
                setAllFoodItems={setAllFoodItems}
                setTabName={setTabName}
                formLoading={isPageLoading}
                setFormLoading={setIsPageLoading}
                restaurantSlug={slug}
                categories={restaurantCategories}
                setCategories={setRestaurantCategories}
              />
            </div>
          )}
        </div>
        <TabsContent value={tabName} className="mt-2">
          {isPageLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
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
                    className="overflow-hidden transition-all duration-200 hover:scale-101 hover:shadow-md cursor-pointer group py-0 gap-0 relative"
                  >
                    <div className={"absolute top-2 right-2 z-10"}>
                      <Tooltip>
                        <TooltipTrigger>
                          <span
                            className={cn(
                              "block w-2 h-2 rounded-full",
                              foodItem.isAvailable
                                ? "bg-green-500"
                                : "bg-red-500"
                            )}
                          ></span>
                          <span className="sr-only">
                            {foodItem.isAvailable
                              ? "Available"
                              : "Not Available"}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {foodItem.isAvailable ? "Available" : "Not Available"}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="absolute top-2 left-2 z-10">
                      <VegNonVegTooltip foodType={foodItem.foodType} innerClassName="size-1.5" />
                    </div>
                    <div className="relative aspect-square">
                      {foodItem.imageUrls?.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted">
                          <IconSalad className="size-8 sm:size-16" />
                        </div>
                      ) : (
                        <Image
                          src={foodItem.imageUrls?.[0] || "/placeholder.svg"}
                          alt={foodItem.foodName}
                          fill
                          priority={index < 3}
                          loading={index < 3 ? "eager" : "lazy"}
                          draggable={false}
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                          className="object-cover transition-all duration-200 group-hover:scale-101"
                        />
                      )}
                    </div>
                    <CardContent className="p-3">
                      <div>
                        <h3 className="font-medium line-clamp-1">
                          {foodItem.foodName}
                        </h3>
                        {typeof foodItem.discountedPrice === "number" &&
                        !isNaN(foodItem.discountedPrice) ? (
                          <p className="text-lg font-semibold">
                            {" "}
                            ₹{foodItem.discountedPrice.toFixed(2)}
                            <span className="line-through ml-2 text-xs">
                              ₹{foodItem.price.toFixed(2)}
                            </span>
                          </p>
                        ) : (
                          <p className="text-lg font-semibold">
                            ₹{foodItem.price.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </FoodDetails>
              ))}
              {(isPageChanging || allFoodItems.totalPages > currentPage) &&
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
            <Card className="@container/card">
              <CardFooter className="flex-col gap-4 text-sm flex justify-center">
                <div className="line-clamp-1 flex gap-2 font-medium text-center text-balance">
                  No food items found
                </div>
                {user?.role === "owner" && tabName === "all" && (
                  <CreateUpdateFoodItem
                    setAllFoodItems={setAllFoodItems}
                    formLoading={isPageLoading}
                    setFormLoading={setIsPageLoading}
                    restaurantSlug={slug}
                  />
                )}
              </CardFooter>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MenuPage;
