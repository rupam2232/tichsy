"use client";

import { useMemo, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { ShoppingBag, Trash2, Minus, Plus } from "lucide-react";
import { IconSalad } from "@tabler/icons-react";
import { toast } from "sonner";
import axios from "@/utils/axiosInstance";
import { AxiosError } from "axios";

import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Textarea } from "@repo/ui/components/textarea";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { cn } from "@repo/ui/lib/utils";
import { ApiResponse, FullOrderDetailsType } from "@repo/types";
import { useCart } from "@/hooks/useCart";
import { getOptimizedUrl } from "@/utils/imageOptimizer";
import VegNonVegTooltip from "@/components/shared/veg-nonveg-tooltip";
import { CartItem } from "@/store/cartSlice";

export interface CartViewHandle {
  confirmOrder: () => Promise<void>;
  isProcessing: boolean;
}

export interface TaxDetails {
  isTaxIncludedInPrice: boolean;
  taxLabel: string;
  taxRate: number;
  taxLabel_?: string; // Fallback if needed, but TaxDetails matches the component state
}

export interface OrderPayloadItem {
  _id: string;
  quantity: number;
  variantName?: string;
}

export interface OrderPayload {
  foodItems: OrderPayloadItem[];
  notes: string;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
}

export interface OrderSuccessData {
  order: FullOrderDetailsType;
}

export interface CartSyncResponse {
  items: CartItem[];
  taxDetails: TaxDetails;
}

interface CartViewProps {
  slug: string;
  tableId: string | null;
  isStaff?: boolean;
  onSuccess?: (response: ApiResponse<OrderSuccessData>) => void;
  onBrowseMenu?: () => void;
  className?: string;
}

const CartView = forwardRef<CartViewHandle, CartViewProps>(
  ({ slug, tableId, isStaff, onSuccess, onBrowseMenu, className }, ref) => {
    const { cartItems, syncCart, removeItem, editItem, clearCart } = useCart(slug);

    const [notes, setNotes] = useState<string>("");
    const [customerName, setCustomerName] = useState<string>("");
    const [customerPhone, setCustomerPhone] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [taxDetails, setTaxDetails] = useState<TaxDetails>();

    useEffect(() => {
      if (slug) {
        syncCart().then((e) => {
          // e.payload is what's returned from the syncCartWithBackend thunk
          const payload = e.payload as CartSyncResponse | undefined;
          if (payload?.taxDetails) {
            setTaxDetails(payload.taxDetails);
          }
        });
      }
    }, [slug, syncCart]);

    const restaurantCartItemSubtotal = useMemo(() => {
      return cartItems.reduce((total, item) => {
        if (typeof item.discountedPrice === "number") {
          return total + item.discountedPrice * item.quantity;
        }
        return total + item.price * item.quantity;
      }, 0);
    }, [cartItems]);

    const preDiscountedPrice = useMemo(() => {
      return cartItems.some((item) => typeof item.discountedPrice === "number")
        ? cartItems.reduce((total, item) => {
            return total + item.price * item.quantity;
          }, 0)
        : null;
    }, [cartItems]);

    const toPay = useMemo(() => {
      return (
        restaurantCartItemSubtotal +
        (taxDetails && !taxDetails.isTaxIncludedInPrice
          ? restaurantCartItemSubtotal * taxDetails.taxRate
          : 0)
      );
    }, [restaurantCartItemSubtotal, taxDetails]);

    const confirmOrder = async () => {
      if (isProcessing) return;

      const toastId = toast.loading("Placing order...");
      setIsProcessing(true);
      try {
        const payload: OrderPayload = {
          foodItems: cartItems.map((item) => ({
            _id: item.foodId,
            quantity: item.quantity,
            variantName: item.variantName || undefined,
          })),
          notes: notes,
          paymentMethod: "cash",
        };

        if (isStaff) {
          payload.customerName = customerName || undefined;
          payload.customerPhone = customerPhone || undefined;
        }

        const response = await axios.post<ApiResponse<OrderSuccessData>>(`/order/${slug}/${tableId}`, payload);

        toast.success(response.data.message || "Order placed successfully!", {
          id: toastId,
        });

        clearCart();

        if (onSuccess) {
          onSuccess(response.data);
        }
      } catch (error) {
        const axiosError = error as AxiosError<ApiResponse>;
        const errorMessage = axiosError.response?.data?.message || axiosError.message || "Failed to place order. Please try again.";
        console.error(errorMessage);
        toast.error(errorMessage, { id: toastId });
      } finally {
        setIsProcessing(false);
      }
    };

    useImperativeHandle(ref, () => ({
      confirmOrder,
      isProcessing
    }));

    if (cartItems.length === 0) {
      return (
        <Card className={cn("w-full", className)}>
          <CardContent>
            <div className="text-center py-8">
              <ShoppingBag className="w-12 h-12 mx-auto mb-4" />
              <p className="text-lg font-bold">Your cart is empty</p>
              <p className="text-muted-foreground mb-6">
                Add some delicious items from {slug}&apos;s menu
              </p>
              {onBrowseMenu && (
                <Button className="bg-primary hover:bg-primary/90" onClick={onBrowseMenu}>
                  Browse Menu
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className={cn("space-y-6 @container/cart-view", className)}>
        <Card className="gap-2">
          <CardHeader>
            <CardTitle>Your Items</CardTitle>
          </CardHeader>
          <CardContent>
            {cartItems.map((item) => (
              <div
                key={item.foodId + (item.variantName || "")}
                className="flex flex-col sm:flex-row sm:items-center space-x-4 pt-2 pb-4 border-b first:border-t last:border-b-0 last:pb-0 relative"
              >
                <Avatar
                  className={cn(
                    "w-16 h-16 shrink-0 rounded-lg",
                    !item.isAvailable && "opacity-80 grayscale"
                  )}
                >
                  <AvatarImage
                    src={getOptimizedUrl(item.imageUrl, 150, 150, "c_fill")}
                    alt={item.foodName}
                    className="object-cover"
                    draggable={false}
                  />
                  <AvatarFallback className="rounded-lg bg-muted text-muted-foreground">
                    <IconSalad className="size-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 items-center">
                  <div
                    className={cn(
                      "flex-1 min-w-0",
                      item.isAvailable ? "opacity-100" : "opacity-80 grayscale"
                    )}
                  >
                    <div className="flex items-center space-x-2">
                      <VegNonVegTooltip foodType={item.foodType} innerClassName="size-1" />
                      <h4 className="font-medium line-clamp-3">
                        {item.foodName} {item.variantName && `(${item.variantName})`}
                      </h4>
                    </div>

                    {typeof item.discountedPrice === "number" ? (
                      <p className="text-sm font-medium">
                        ₹{item.discountedPrice.toFixed(2)}
                        <span className="line-through ml-2 text-xs text-muted-foreground font-normal">
                          ₹{item.price.toFixed(2)}
                        </span>
                      </p>
                    ) : (
                      <p className="text-sm font-medium">₹{item.price.toFixed(2)}</p>
                    )}

                    <div className="flex items-center space-x-2 mt-2 dark:border-zinc-600 border rounded-md w-min">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={item.isAvailable === false}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.quantity > 1) {
                            editItem({ ...item, quantity: item.quantity - 1 });
                          } else {
                            removeItem(item);
                          }
                        }}
                        className="w-8 h-8"
                      >
                        <Minus className="w-3 h-3" />
                        <span className="sr-only">Remove from cart</span>
                      </Button>
                      <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={item.isAvailable === false}
                        onClick={(e) => {
                          e.stopPropagation();
                          editItem({ ...item, quantity: item.quantity + 1 });
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
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Textarea
          className="my-4 border rounded-md resize-none text-wrap whitespace-pre-wrap min-h-11 max-h-40"
          placeholder="Add special instructions..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <Card className="gap-4">
          <CardHeader>
            <CardTitle>Bill Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
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
              {taxDetails && !taxDetails.isTaxIncludedInPrice && taxDetails.taxLabel && (
                <div className="flex justify-between text-sm">
                  <span>{taxDetails.taxLabel}</span>
                  <span>₹{(restaurantCartItemSubtotal * taxDetails.taxRate).toFixed(2)}</span>
                </div>
              )}
              <hr />
              <div className="flex justify-between font-bold text-lg">
                <span>To Pay</span>
                <span>₹{toPay.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {isStaff && (
          <Card className="gap-4">
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Customer Name</Label>
                <Input
                  id="customer-name"
                  placeholder="Enter Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-phone">Customer Phone</Label>
                <Input
                  id="customer-phone"
                  placeholder="Enter Customer Phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
);

CartView.displayName = "CartView";

export default CartView;
