"use client";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerTitle,
  DrawerTrigger,
} from "@repo/ui/components/drawer";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@repo/ui/components/button";
import { IconSalad } from "@tabler/icons-react";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { cn } from "@repo/ui/lib/utils";
import { useEffect, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { fetchRestaurantDetails } from "@/utils/fetchRestaurantDetails";
import { Textarea } from "@repo/ui/components/textarea";
import axios from "@/utils/axiosInstance";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { ApiResponse } from "@repo/ui/types/ApiResponse";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { addOrder } from "@/store/orderHistorySlice";
import VegNonVegTooltip from "@/components/veg-nonveg-tooltip";

const CheckoutModalPage = () => {
  const router = useRouter();
  const { slug: restaurantSlug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const tableId = searchParams.get("tableId");
  const [drawerOpen, setDrawerOpen] = useState<boolean>(true);
  const { syncCart, cartItems, removeItem, editItem, clearCart } =
    useCart(restaurantSlug);
  const [taxDetails, setTaxDetails] = useState<{
    isTaxIncludedInPrice: boolean;
    taxLabel: string;
    taxRate: number;
  }>();
  const [notes, setNotes] = useState<string>("");
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (restaurantSlug) {
      syncCart().then((e) => {
        setTaxDetails(e.payload?.taxDetails);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantSlug]);

  useEffect(() => {
    let isMounted = true;
    const previousTitle = document.title;

    if (drawerOpen) {
      fetchRestaurantDetails(restaurantSlug).then((restaurant) => {
        if (isMounted) {
          document.title = `Cart | ${restaurant.restaurantName}`;
        }
      });
    }

    return () => {
      document.title = previousTitle;
      isMounted = false;
    };
  }, [restaurantSlug, drawerOpen]);

  const restaurantCartItemSubtotal = cartItems.reduce((total, item) => {
    if (typeof item.discountedPrice === "number") {
      return total + item.discountedPrice * item.quantity;
    }
    return total + item.price * item.quantity;
  }, 0);

  const preDiscountedPrice = cartItems.some(
    (item) => typeof item.discountedPrice === "number"
  )
    ? cartItems.reduce((total, item) => {
        return total + item.price * item.quantity;
      }, 0)
    : null;

  const toPay =
    restaurantCartItemSubtotal +
    (taxDetails && !taxDetails.isTaxIncludedInPrice
      ? restaurantCartItemSubtotal * taxDetails.taxRate
      : 0);

  const confirmOrder = async () => {
    const toastId = toast.loading("Placing order...");
    try {
      const response = await axios.post(`/order/${restaurantSlug}/${tableId}`, {
        foodItems: cartItems.map((item) => ({
          _id: item.foodId,
          quantity: item.quantity,
          variantName: item.variantName || undefined,
        })),
        notes: notes,
        paymentMethod: "cash",
      });
      toast.success(response.data.message || "Order placed successfully!", {
        id: toastId,
      });
      dispatch(
        addOrder({
          restaurantSlug: restaurantSlug,
          orderId: response.data.data.order._id,
        })
      );
      clearCart();
      router.replace(`/${restaurantSlug}/my-orders`);
      setDrawerOpen(false);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      console.error(axiosError.response?.data.message || axiosError.message);
      toast.error(
        axiosError.response?.data.message ||
          "Failed to place order. Please try again.",
        {
          id: toastId,
        }
      );
    }
  };

  return (
    <Drawer
      open={drawerOpen}
      onOpenChange={(open) => {
        setDrawerOpen(open);
        if (!open) {
          router.back();
        }
      }}
    >
      <DrawerTrigger className="hidden">Cart</DrawerTrigger>
      <DrawerContent className="w-full h-full data-[vaul-drawer-direction=bottom]:max-h-[85vh]">
        <div className="w-full md:mx-auto md:w-2xl lg:w-3xl h-full">
          <DrawerTitle className="px-6 pb-2 border-b text-lg">Cart</DrawerTitle>
          <ScrollArea className="h-full pb-6 md:py-2">
            <div className="px-6">
              {cartItems.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-lg font-bold">Your cart is empty</p>
                  <p className="text-muted-foreground">
                    Add some delicious items from {restaurantSlug}&apos;s menu
                  </p>
                </div>
              ) : (
                <div>
                  {cartItems.map((item) => (
                    <div
                      key={item.foodId + (item.variantName || "")}
                      className="flex items-center space-x-4 pt-2 pb-4 border-b last:border-b-0 last:pb-0 relative"
                    >
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          width={64}
                          height={64}
                          draggable={false}
                          sizes="(max-width: 640px) 100px, (min-width: 641px) 150px"
                          priority
                          alt={item.foodName}
                          className={cn(
                            "w-16 h-16 object-cover rounded-lg",
                            item.isAvailable
                              ? "opacity-100"
                              : "opacity-80 grayscale"
                          )}
                        />
                      ) : (
                        <div
                          className={cn(
                            "flex items-center justify-center bg-muted w-16 h-16 rounded-lg",
                            item.isAvailable
                              ? "opacity-100"
                              : "opacity-80 grayscale"
                          )}
                        >
                          <IconSalad className="size-5" />
                        </div>
                      )}

                      <div
                        className={cn(
                          "flex-1 min-w-0",
                          item.isAvailable
                            ? "opacity-100"
                            : "opacity-80 grayscale"
                        )}
                      >
                        <div className="flex items-center space-x-2">
                          <VegNonVegTooltip foodType={item.foodType} innerClassName="size-1" />
                          <h4 className="font-medium line-clamp-3">
                            {item.foodName}{" "}
                            {item.variantName && `(${item.variantName})`}
                          </h4>
                        </div>

                        {typeof item.discountedPrice === "number" ? (
                          <p className="text-sm font-medium">
                            {" "}
                            ₹{item.discountedPrice.toFixed(2)}
                            <span className="line-through ml-2 text-xs text-muted-foreground font-normal">
                              ₹{item.price.toFixed(2)}
                            </span>
                          </p>
                        ) : (
                          <p className="text-sm font-medium">
                            ₹{item.price.toFixed(2)}
                          </p>
                        )}

                        <div className="flex items-center space-x-2 mt-2 dark:border-zinc-600 border rounded-md w-min">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={item.isAvailable === false}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.quantity > 1) {
                                editItem({
                                  ...item,
                                  quantity: item.quantity - 1,
                                });
                              } else {
                                removeItem(item);
                              }
                            }}
                            className="w-8 h-8"
                          >
                            <Minus className="w-3 h-3" />
                            <span className="sr-only">Remove from cart</span>
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={item.isAvailable === false}
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
                      </div>

                      <div className="text-right">
                        {item.isAvailable === false ? (
                          <p className="text-sm font-medium">Unavailable</p>
                        ) : typeof item.discountedPrice === "number" ? (
                          <p className="text-sm font-medium flex flex-col items-end">
                            <span className="line-through ml-2 text-xs text-muted-foreground font-normal">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </span>
                            ₹{(item.discountedPrice * item.quantity).toFixed(2)}
                          </p>
                        ) : (
                          <p className="text-sm font-medium">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </p>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item)}
                          className="text-red-500 hover:text-red-700 transition-colors opacity-100! grayscale-0! z-20"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Textarea
                    className="my-4 border rounded-md bg-muted resize-none text-wrap whitespace-pre-wrap min-h-11 max-h-40"
                    placeholder="Add special instructions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />

                  <div className="py-6 border-t mb-40">
                    <div className="space-y-2 mb-4">
                      <h3 className="text-lg font-semibold">Bill Summary</h3>
                      <div className="flex justify-between text-sm">
                        <span>Sub Total</span>
                        <div className="flex items-center space-x-2">
                          {preDiscountedPrice && (
                            <span className="text-xs line-through opacity-70">
                              ₹{preDiscountedPrice.toFixed(2)}
                            </span>
                          )}
                          <span>₹{restaurantCartItemSubtotal.toFixed(2)}</span>
                        </div>
                      </div>
                      {(taxDetails && !taxDetails.isTaxIncludedInPrice && taxDetails.taxLabel) && (
                        <div className="flex justify-between text-sm">
                          <span>{taxDetails.taxLabel}</span>
                          <span>
                            ₹
                            {(
                              restaurantCartItemSubtotal * taxDetails.taxRate
                            ).toFixed(2)}
                          </span>
                        </div>
                      )}
                      <hr />
                      <div className="flex justify-between font-bold text-lg">
                        <span>To Pay</span>
                        <span>₹{toPay.toFixed(2)}</span>
                      </div>
                    </div>

                    <DrawerFooter className="flex flex-col gap-2 absolute bottom-14 left-0 right-0 p-4 border-t backdrop-blur-lg bg-background/40">
                      <Button
                        className="w-full transition-colors"
                        disabled={
                          cartItems.length === 0 ||
                          cartItems.some((item) => item.isAvailable === false)
                        }
                        onClick={confirmOrder}
                      >
                        Confirm Order
                      </Button>

                      <DrawerClose asChild>
                        <Button variant="outline" className="w-full">
                          Continue Shopping
                        </Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        <DrawerClose
          asChild
          className={cn(
            "absolute right-1/2 translate-x-1/2 z-10 transition-all duration-200",
            drawerOpen ? "-top-14 opacity-100" : "-top-0 opacity-0"
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

export default CheckoutModalPage;
