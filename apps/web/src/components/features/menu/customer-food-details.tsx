import { cn } from "@repo/ui/lib/utils";
import { Button } from "@repo/ui/components/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@repo/ui/components/drawer";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import axios from "@/utils/axiosInstance";
import {
  FoodItem,
  AllFoodItems,
  FoodItemDetails,
  FoodVariant,
  ApiResponse,
} from "@repo/types";
import { Loader2, Minus, Plus, Trash2, X } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@repo/ui/components/carousel";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { Badge } from "@repo/ui/components/badge";
import { useCart } from "@/hooks/useCart";
import { Label } from "@repo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Separator } from "@repo/ui/components/separator";
import VegNonVegTooltip from "@/components/shared/veg-nonveg-tooltip";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import { getOptimizedUrl } from "@/utils/imageOptimizer";
import { IconSalad } from "@tabler/icons-react";

const CustomerFoodDetails = ({
  foodItem,
  setAllFoodItems,
  restaurantSlug,
  showEditDrawer = false,
  drawerOpen,
  setDrawerOpen,
}: {
  foodItem: FoodItem;
  setAllFoodItems: React.Dispatch<React.SetStateAction<AllFoodItems | null>>;
  restaurantSlug: string;
  showEditDrawer?: boolean;
  drawerOpen: boolean;
  setDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [foodItemDetails, setFoodItemDetails] =
    useState<FoodItemDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [carouselCurrent, setCarouselCurrent] = useState<number>(0);
  const [carouselCount, setCarouselCount] = useState<number>(0);
  const [variantName, setVariantName] = useState<string>("");
  const [itemCount, setItemCount] = useState<number>(1);
  const { cartItems, addItem, removeItem, editItem, syncCart } =
    useCart(restaurantSlug);

  const fetchFoodItemDetails = useCallback(async () => {
    if (!foodItem || !foodItem._id) {
      toast.error("Something went wrong. Please refresh the page");
      setFoodItemDetails(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.get(
        `/food-item/${restaurantSlug}/${foodItem._id}`,
      );
      setFoodItemDetails(response.data.data);
      setAllFoodItems((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          foodItems: prev.foodItems.map((item) =>
            item._id === foodItem._id ? { ...response.data.data } : item,
          ),
        };
      });
      if (
        response.data.data.hasVariants &&
        response.data.data.variants?.length > 0
      ) {
        const availableDefaultVariant =
          response.data.data.variants.find(
            (v: FoodVariant) => v.isDefault && v.isAvailable,
          ) ||
          response.data.data.variants.find((v: FoodVariant) => v.isAvailable);
        setVariantName(availableDefaultVariant?.variantName || "");
      } else {
        setVariantName("");
      }
    } catch (error) {
      console.error(
        "Failed to fetch food item details. Please try again later:",
        error,
      );
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Failed to fetch food item details. Please try again later",
      );
      setFoodItemDetails(null);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantSlug, foodItem, setAllFoodItems]);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }
    setCarouselCount(carouselApi.scrollSnapList().length);
    setCarouselCurrent(carouselApi.selectedScrollSnap() + 1);
    carouselApi.on("select", () => {
      setCarouselCurrent(carouselApi.selectedScrollSnap() + 1);
    });
  }, [carouselApi]);

  const handleAddItem = useCallback(() => {
    if (!foodItemDetails) return;

    if (!foodItemDetails.isAvailable) {
      toast.error("This item is currently unavailable");
      fetchFoodItemDetails();
      syncCart();
      return;
    }

    if (foodItemDetails.variants && foodItemDetails.variants.length > 0) {
      const variant = foodItemDetails.variants.find(
        (entry) => entry.variantName === variantName,
      );
      if (!variant || !variant.isAvailable) {
        toast.error("Selected variant is currently unavailable");
        fetchFoodItemDetails();
        syncCart();
        return;
      }
    }

    if (foodItemDetails.variants && foodItemDetails.variants.length > 0) {
      const variant = foodItemDetails.variants.find(
        (variant) => variant.variantName === variantName,
      );
      if (variant) {
        addItem({
          ...variant,
          quantity: itemCount,
          foodId: foodItemDetails._id,
          restaurantSlug,
          foodName: foodItemDetails.foodName,
          foodType: foodItemDetails.foodType,
          imageUrl: foodItemDetails.imageUrls?.[0],
        });
      }
    } else {
      const existingItem = cartItems.find(
        (item) =>
          item.foodId === foodItemDetails._id &&
          (item.variantName === null || item.variantName === undefined),
      );
      if (existingItem) {
        editItem({
          ...existingItem,
          variantName: undefined,
          quantity: existingItem.quantity + itemCount,
        });
      } else {
        addItem({
          ...foodItemDetails,
          price: foodItemDetails.price || 0,
          quantity: itemCount,
          restaurantSlug,
          foodId: foodItemDetails._id,
          imageUrl: foodItemDetails.imageUrls?.[0],
        });
      }
    }
    setDrawerOpen(false);
  }, [
    foodItemDetails,
    variantName,
    itemCount,
    addItem,
    editItem,
    setDrawerOpen,
    cartItems,
    restaurantSlug,
    fetchFoodItemDetails,
    syncCart,
  ]);

  const itemPrice = useMemo(() => {
    return foodItemDetails
      ? foodItemDetails.variants && foodItemDetails.variants.length > 0
        ? foodItemDetails.variants.find(
            (variant) => variant.variantName === variantName,
          )?.price
        : foodItemDetails.price
      : foodItem.price;
  }, [foodItem.price, foodItemDetails, variantName]);

  const itemDiscountedPrice = useMemo(() => {
    return foodItemDetails
      ? foodItemDetails.variants && foodItemDetails.variants.length > 0
        ? foodItemDetails.variants.find(
            (variant) => variant.variantName === variantName,
          )?.discountedPrice
        : foodItemDetails.discountedPrice
      : foodItem.discountedPrice;
  }, [foodItem.discountedPrice, foodItemDetails, variantName]);

  const variantsByName = useMemo(() => {
    const variants = foodItemDetails?.variants || [];
    return new Map(variants.map((variant) => [variant.variantName, variant]));
  }, [foodItemDetails?.variants]);

  const hasVariants = (foodItemDetails?.variants?.length || 0) > 0;

  const selectedVariant = useMemo(() => {
    if (!hasVariants || !variantName) {
      return null;
    }
    return variantsByName.get(variantName) || null;
  }, [hasVariants, variantName, variantsByName]);

  const canAddSelectedItem = useMemo(() => {
    if (!foodItemDetails?.isAvailable) {
      return false;
    }
    if (!hasVariants) {
      return true;
    }
    if (!selectedVariant) {
      return false;
    }
    return !!selectedVariant.isAvailable;
  }, [foodItemDetails?.isAvailable, hasVariants, selectedVariant]);

  const addDisabledReason = useMemo(() => {
    if (!foodItemDetails?.isAvailable) {
      return "Not Available";
    }
    if (hasVariants && !selectedVariant) {
      return "Select an available variant";
    }
    if (hasVariants && selectedVariant && !selectedVariant.isAvailable) {
      return "Selected variant unavailable";
    }
    return null;
  }, [foodItemDetails?.isAvailable, hasVariants, selectedVariant]);

  useEffect(() => {
    if (drawerOpen && !showEditDrawer) {
      setFoodItemDetails(null);
      setIsLoading(true);
      fetchFoodItemDetails();
      setItemCount(1);
      setVariantName("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen, foodItem._id]);

  useEffect(() => {
    if (showEditDrawer) {
      syncCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEditDrawer]);

  const cartItemsFiltered = useMemo(() => {
    return cartItems.filter((item) => item.foodId === foodItem._id);
  }, [cartItems, foodItem._id]);

  if (showEditDrawer) {
    return (
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerTrigger className="hidden">Open</DrawerTrigger>
        <DrawerContent className="w-full h-full data-[vaul-drawer-direction=bottom]:max-h-[85vh]">
          <div className="w-full md:mx-auto md:w-2xl lg:w-3xl h-full">
            <ScrollArea className="h-full pt-3 pb-6 md:py-2">
              <DrawerTitle className="px-4">Edit Food Items</DrawerTitle>
              <div className="p-4">
                <Card className="gap-2 py-3 bg-muted/50">
                  {cartItemsFiltered.length > 0 && (
                    <div className="px-2 space-y-4">
                      {cartItemsFiltered.map((item) => (
                        <div
                          key={item.foodId + (item.variantName || "")}
                          className="flex justify-between items-center gap-x-4"
                        >
                          <div>
                            <VegNonVegTooltip
                              foodType={item.foodType}
                              innerClassName="size-1"
                            />
                            <h3>
                              {item.foodName}{" "}
                              {item.variantName && `(${item.variantName})`}
                            </h3>
                            <p className="font-medium">
                              {typeof item.discountedPrice === "number" ? (
                                <>
                                  <span className="mr-2">
                                    ₹{item.discountedPrice.toFixed(2)}
                                  </span>{" "}
                                  <span className="line-through text-sm text-muted-foreground">
                                    ₹{item.price.toFixed(2)}
                                  </span>
                                </>
                              ) : (
                                `₹${item.price.toFixed(2)}`
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {item.description}
                            </p>
                          </div>
                          {item.isAvailable ? (
                            <div className="flex flex-col">
                              <div className="flex items-center space-x-2 dark:border-zinc-600 border rounded-md w-min">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (item.quantity > 1) {
                                      editItem({
                                        ...item,
                                        quantity: item.quantity - 1,
                                      });
                                    } else {
                                      removeItem(item);
                                      if (cartItemsFiltered.length <= 1) {
                                        setDrawerOpen(false);
                                      }
                                    }
                                  }}
                                  className="w-8 h-8"
                                >
                                  <Minus className="w-3 h-3" />
                                  <span className="sr-only">
                                    Remove from cart
                                  </span>
                                </Button>
                                <span className="text-sm font-medium w-8 text-center">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    editItem({
                                      ...item,
                                      quantity: item.quantity + 1,
                                    });
                                  }}
                                  className="w-8 h-8"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span className="sr-only">Add to cart</span>
                                </Button>
                              </div>
                              <p className="font-medium text-center">
                                ₹
                                {typeof item.discountedPrice === "number"
                                  ? (
                                      item.discountedPrice * item.quantity
                                    ).toFixed(2)
                                  : (item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center px-3">
                              <p className="text-sm text-muted-foreground font-medium">
                                Unavailable
                              </p>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                              >
                                <Trash2 />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </ScrollArea>
          </div>
          <DrawerClose
            asChild
            className={cn(
              "absolute right-1/2 translate-x-1/2 z-10 transition-all duration-200",
              drawerOpen ? "-top-14 opacity-100" : "-top-0 opacity-0",
            )}
          >
            <Button variant="outline" className="rounded-full px-2.5! py-1.5!">
              <X />
              <span className="sr-only">Close</span>
            </Button>
          </DrawerClose>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Drawer
      onOpenChange={(open) => {
        setDrawerOpen(open);
        setItemCount(1);
        if (open) {
          fetchFoodItemDetails();
        }
      }}
      open={drawerOpen}
    >
      <DrawerTrigger className="hidden">Open</DrawerTrigger>
      <DrawerContent className="w-full h-full data-[vaul-drawer-direction=bottom]:max-h-[85vh]">
        <DrawerTitle className="sr-only">Food Item Details</DrawerTitle>
        <div className="w-full md:mx-auto md:w-2xl lg:w-3xl h-full relative">
          <ScrollArea className="h-full pt-3" scrollbarClassName="hidden" scrollbarThumbClassName="hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin" />
              </div>
            ) : foodItemDetails ? (
              <>
                <div className="space-y-3 p-4 pt-0">
                  <Card className="gap-2 py-3 bg-muted/50">
                    <CardContent className="px-3">
                      {foodItemDetails.imageUrls &&
                        foodItemDetails.imageUrls.length > 0 && (
                          <div>
                            <Carousel
                              setApi={setCarouselApi}
                              className="rounded-xl w-full max-w-xs mx-auto"
                            >
                              <CarouselContent
                                setCarouselCount={setCarouselCount}
                                setCarouselCurrent={setCarouselCurrent}
                                className="aspect-square ml-0 space-x-4"
                              >
                                {foodItemDetails.imageUrls.map((url, index) => (
                                  <CarouselItem
                                    key={index}
                                    className="relative rounded-xl pl-0"
                                  >
                                    <Avatar className="h-full w-full rounded-lg">
                                      <AvatarImage
                                        src={getOptimizedUrl(url, 500, 500)}
                                        alt={`Food Item Image ${index + 1}`}
                                        className="object-cover"
                                        draggable={false}
                                      />
                                      <AvatarFallback className="rounded-lg">
                                        <IconSalad className="size-8 sm:size-16" />
                                      </AvatarFallback>
                                    </Avatar>
                                  </CarouselItem>
                                ))}
                              </CarouselContent>
                              <CarouselPrevious className="left-2 z-10" />
                              <CarouselNext className="right-2 z-10" />
                            </Carousel>
                            <p className="text-muted-foreground py-2 text-center text-sm">
                              {foodItemDetails.imageUrls &&
                              foodItemDetails.imageUrls.length > 0 ? (
                                <>
                                  Slide {carouselCurrent} of {carouselCount}
                                </>
                              ) : (
                                <>Slide 0 of 0</>
                              )}
                            </p>
                          </div>
                        )}
                      <CardHeader className="px-0 gap-0">
                        <div className="flex items-end justify-between gap-2">
                          <div>
                            <VegNonVegTooltip
                              foodType={foodItemDetails.foodType}
                              innerClassName="size-1"
                            />
                            <CardTitle className="whitespace-pre-wrap font-bold text-xl">
                              {foodItemDetails.foodName}
                            </CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      {typeof foodItemDetails.discountedPrice === "number" &&
                      !isNaN(foodItemDetails.discountedPrice) ? (
                        <p className="text-lg font-semibold">
                          {" "}
                          ₹{foodItemDetails.discountedPrice.toFixed(2)}
                          <span className="line-through ml-2 text-xs text-muted-foreground">
                            ₹{(foodItemDetails.price || 0).toFixed(2)}
                          </span>
                        </p>
                      ) : (
                        <p className="text-lg font-semibold">
                          ₹{(foodItemDetails.price || 0).toFixed(2)}
                        </p>
                      )}

                      {foodItemDetails.description && (
                        <CardDescription className="whitespace-pre-wrap">
                          {foodItemDetails.description}
                        </CardDescription>
                      )}
                    </CardContent>
                  </Card>

                  {foodItemDetails.variants &&
                    foodItemDetails.variants.length > 0 && (
                      <Card className="gap-2 pb-0 pt-1 bg-muted/50">
                        <CardHeader className="px-3 gap-0">
                          <CardTitle className="whitespace-pre-wrap text-lg font-semibold">
                            Variants
                          </CardTitle>
                          <CardDescription>
                            Select a variant for this item
                          </CardDescription>
                        </CardHeader>
                        <Separator className="mx-1" />
                        <CardContent className="px-1 pb-2">
                          <RadioGroup
                            value={variantName}
                            onValueChange={setVariantName}
                            className="gap-0"
                          >
                            {foodItemDetails.variants.map((variant, index) => (
                              <div key={index}>
                                <Separator className="mx-1" />
                                <div
                                  className={cn(
                                    "flex justify-between space-x-4 w-full rounded-sm px-2 py-2",
                                    variant.isAvailable
                                      ? "cursor-pointer hover:bg-muted"
                                      : "opacity-70 cursor-not-allowed",
                                    variantName === variant.variantName
                                      ? "items-start"
                                      : "items-center",
                                  )}
                                >
                                  <Label
                                    htmlFor={variant.variantName}
                                    className={cn(
                                      "flex-1 flex-col justify-start py-0",
                                      variant.isAvailable
                                        ? "cursor-pointer"
                                        : "cursor-not-allowed",
                                    )}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <span>
                                        {variant.variantName}
                                        {!variant.isAvailable && (
                                          <span className="text-xs text-muted-foreground ml-2">
                                            Unavailable
                                          </span>
                                        )}
                                      </span>
                                      <div className="text-right">
                                        {typeof variant.discountedPrice ===
                                        "number" ? (
                                          <>
                                            <span className="text-xs line-through text-muted-foreground mr-2">
                                              ₹{variant.price.toFixed(2)}
                                            </span>
                                            <span className="text-sm font-semibold">
                                              ₹
                                              {variant.discountedPrice.toFixed(
                                                2,
                                              )}
                                            </span>
                                          </>
                                        ) : (
                                          <span className="text-sm font-semibold">
                                            ₹{variant.price.toFixed(2)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {variant.description && (
                                      <p
                                        className={cn(
                                          "text-sm pb-2 text-muted-foreground animate-in fade-in duration-300 w-full font-normal",
                                          variantName === variant.variantName
                                            ? "block"
                                            : "hidden h-0",
                                        )}
                                      >
                                        {variant.description}
                                      </p>
                                    )}
                                  </Label>

                                  <RadioGroupItem
                                    value={variant.variantName}
                                    id={variant.variantName}
                                    disabled={!variant.isAvailable}
                                    className="border-primary cursor-pointer mt-1"
                                  />
                                </div>
                              </div>
                            ))}
                          </RadioGroup>
                        </CardContent>
                      </Card>
                    )}

                  {foodItemDetails.tags && foodItemDetails.tags.length > 0 && (
                    <Card className="gap-2 py-2 bg-muted/50">
                      <CardHeader className="px-3 gap-0">
                        <CardTitle>Tags</CardTitle>
                      </CardHeader>
                      <Separator className="mx-1" />
                      <CardContent className="px-3">
                        {foodItemDetails.tags.map((tag, index) => (
                          <Badge
                            variant="secondary"
                            key={index}
                            className="mx-1 my-1"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p>No details available for this food item.</p>
              </div>
            )}
            <div className="h-30" />
          </ScrollArea>
          {!isLoading && (
            <Card
              className={cn(
                "w-full md:w-2xl lg:w-3xl p-3 backdrop-blur-sm bg-background/50 sticky ease-linear z-10",
                !foodItemDetails?.description &&
                  foodItemDetails?.variants?.length === 0 &&
                  foodItemDetails.tags?.length === 0
                  ? "bottom-0"
                  : "bottom-0",
              )}
            >
              <CardDescription>
                {canAddSelectedItem ? (
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2 dark:border-zinc-600 border rounded-md w-min">
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-sm h-8 gap-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemCount((prev) => Math.max(prev - 1, 1));
                        }}
                      >
                        <Minus />
                        <span className="sr-only">Remove from cart</span>
                      </Button>
                      <span className="text-sm">{itemCount}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-sm h-8 gap-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemCount((prev) => prev + 1);
                        }}
                      >
                        <Plus />
                        <span className="sr-only">Add to cart</span>
                      </Button>
                    </div>
                    <Button
                      className="w-3/6 md:w-2/5 whitespace-pre-wrap flex-wrap h-auto gap-y-0 px-2"
                      onClick={handleAddItem}
                    >
                      Add
                      {typeof itemDiscountedPrice === "number" ? (
                        <>
                          <span className="text-xs line-through font-normal items-baseline">
                            ₹{((itemPrice ?? 1) * itemCount).toFixed(2)}
                          </span>
                          <span className="text-sm font-semibold">
                            ₹{(itemDiscountedPrice * itemCount).toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm font-semibold">
                          ₹{((itemPrice ?? 1) * itemCount).toFixed(2)}
                        </span>
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="text-sm h-8 gap-0"
                    disabled
                  >
                    {addDisabledReason || "Not Available"}
                  </Button>
                )}
              </CardDescription>
            </Card>
          )}
        </div>
        <DrawerClose
          asChild
          className={cn(
            "absolute right-1/2 translate-x-1/2 z-10 transition-all duration-200",
            drawerOpen ? "-top-14 opacity-100" : "-top-0 opacity-0",
          )}
        >
          <Button variant="outline" className="rounded-full px-2.5! py-1.5!">
            <X />
            <span className="sr-only">Close</span>
          </Button>
        </DrawerClose>
      </DrawerContent>
    </Drawer>
  );
};

export default CustomerFoodDetails;
