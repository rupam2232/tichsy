"use client";
import { Button } from "@repo/ui/components/button";
import { useRouter, useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import axios from "@/utils/axiosInstance";
import type { AxiosError } from "axios";
import { ApiResponse, AllTables } from "@repo/types";
import { useDispatch, useSelector } from "react-redux";
import { signOut } from "@/store/authSlice";
import { cn } from "@repo/ui/lib/utils";
import ClinetFoodMenu from "@/components/features/menu/food-menu";
import { Check, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import Image from "next/image";
import { IconSalad } from "@tabler/icons-react";
import { Textarea } from "@repo/ui/components/textarea";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Skeleton } from "@repo/ui/components/skeleton";
import Link from "next/link";
import { RootState } from "@/store/store";
import VegNonVegTooltip from "@/components/shared/veg-nonveg-tooltip";

const FoodOrderStepsForStaffs = ({
  step,
  setStep,
  onClose,
  className,
  footerClassName,
}: {
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  onClose?: () => void;
  className?: string;
  footerClassName?: string;
}) => {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const activeRestaurant = useSelector(
    (state: RootState) => state.restaurantsSlice.activeRestaurant,
  );
  const [page, setPage] = useState<number>(1);
  const [allTables, setAllTables] = useState<AllTables | null>(null);
  const [isTablePageLoading, setIsTablePageLoading] = useState<boolean>(false);
  const [isTablePageChanging, setIsTablePageChanging] =
    useState<boolean>(false);
  const [tableId, setTableId] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver>(null);
  const { cartItems, syncCart, removeItem, editItem, clearCart } =
    useCart(slug);
  const [notes, setNotes] = useState<string>("");
  const [taxDetails, setTaxDetails] = useState<{
    isTaxIncludedInPrice: boolean;
    taxLabel: string;
    taxRate: number;
  }>();
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchAllTables = useCallback(async () => {
    if (!slug) {
      console.error("Restaurant slug is required to fetch tables");
      toast.error("Restaurant slug is required to fetch tables");
      return;
    }
    try {
      if (page === 1) {
        setIsTablePageLoading(true);
        const response = await axios.get(`/table/${slug}`);
        setAllTables(response.data.data);
      } else {
        setIsTablePageChanging(true);
        const response = await axios.get(`/table/${slug}?page=${page}`);
        setAllTables((prev) => ({
          ...response.data.data,
          tables: [...(prev?.tables || []), ...response.data.data.tables],
        }));
      }
    } catch (error) {
      console.error(
        "Failed to fetch all tables. Please try again later:",
        error,
      );
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Failed to fetch all tables. Please try again later",
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push(`/signin?redirect=${window.location.pathname}`);
      }
      setAllTables(null);
    } finally {
      setIsTablePageChanging(false);
      setIsTablePageLoading(false);
    }
  }, [slug, router, dispatch, page]);

  useEffect(() => {
    if (activeRestaurant && activeRestaurant.isCurrentlyOpen) {
      fetchAllTables();
    }
  }, [fetchAllTables, activeRestaurant]);

  const lastTableElementRef = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries && Array.isArray(entries) && entries[0]?.isIntersecting) {
        if (allTables && allTables?.totalPages > page) {
          if (!isTablePageChanging) {
            setPage((prevPageNumber) => prevPageNumber + 1);
          }
        }
      }
    });
    if (node) observer.current.observe(node);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (slug) {
      syncCart().then((e) => {
        setTaxDetails(e.payload?.taxDetails);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [step]);

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
    const toastId = toast.loading("Placing order...");
    try {
      const response = await axios.post(`/order/${slug}/${tableId}`, {
        foodItems: cartItems.map((item) => ({
          _id: item.foodId,
          quantity: item.quantity,
          variantName: item.variantName || undefined,
        })),
        notes: notes,
        paymentMethod: "cash",
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
      });
      toast.success(response.data.message || "Order placed successfully!", {
        id: toastId,
      });
      clearCart();
      if (onClose) {
        onClose();
      } else {
        router.back();
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      console.error(axiosError.response?.data.message || axiosError.message);
      toast.error(
        axiosError.response?.data.message ||
          "Failed to place order. Please try again.",
        {
          id: toastId,
        },
      );
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  if (!activeRestaurant || !activeRestaurant.isCurrentlyOpen) {
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
    <div
      className={cn(
        "flex flex-col h-full @container/food-order-steps-for-staffs",
        className,
      )}
    >
      <div
        ref={scrollContainerRef}
        className="flex-1 px-6 custom-scrollbar overflow-y-auto"
      >
        {step === 1 && (
          <>
            {isTablePageLoading ? (
              <div className="grid grid-cols-2 @lg/food-order-steps-for-staffs:grid-cols-3 @2xl/food-order-steps-for-staffs:grid-cols-4 gap-3 pt-2 px-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="min-h-25 w-full" />
                ))}
              </div>
            ) : allTables && allTables.tables.length > 0 ? (
              <div className="grid grid-cols-2 @lg/food-order-steps-for-staffs:grid-cols-3 @2xl/food-order-steps-for-staffs:grid-cols-4 gap-3 p-2 mb-20">
                {allTables.tables.map((t, index) => (
                  <div
                    ref={
                      index === allTables.tables.length - 1
                        ? lastTableElementRef
                        : undefined
                    }
                    role="button"
                    onClick={() => {
                      if (!t.isOccupied) {
                        setTableId(t.qrSlug);
                      }
                    }}
                    key={t._id}
                    className={cn(
                      "rounded-md ring-3 ring-transparent cursor-pointer transition-all duration-200 relative",
                      t.isOccupied
                        ? "hover:ring-destructive"
                        : "hover:ring-primary",
                      t.isOccupied && "opacity-50 cursor-not-allowed",
                      tableId === t.qrSlug && "ring-primary",
                    )}
                  >
                    {tableId === t.qrSlug && (
                      <span className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 rounded-xl bg-primary">
                        <Check className="text-white size-4" />
                      </span>
                    )}
                    <div
                      className={cn(
                        "rounded-md p-3 flex flex-col items-center justify-center text-sm truncate min-h-25 border",
                        t.isOccupied
                          ? "bg-red-100 text-red-700 border-red-200"
                          : "bg-green-100 text-green-700 border-green-200",
                      )}
                    >
                      <span className="font-medium text-xs text-center text-balance">
                        {t.tableName}
                      </span>
                    </div>
                  </div>
                ))}
                {isTablePageChanging &&
                  Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="w-full min-h-[60px]" />
                  ))}
              </div>
            ) : (
              <div className="flex items-center justify-center flex-col space-y-4 h-full">
                <p className="text-center text-muted-foreground">
                  No tables created yet. Please create a table to proceed.
                </p>
                {user?.role === "owner" && (
                  <Link href={`/restaurant/${slug}/tables`}>
                    <Button type="button">Create a new table</Button>
                  </Link>
                )}
              </div>
            )}
          </>
        )}
        <ClinetFoodMenu
          slug={slug}
          tableId={tableId}
          isStaffCreatingOrder={true}
          scrollClassName="max-w-[calc(100vw-3rem)] overflow-y-auto"
          className={cn(step !== 2 && "hidden")}
        />
        {step === 3 &&
          (cartItems.length === 0 ? (
            <Card>
              <CardContent>
                <div className="text-center py-8">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-lg font-bold">Your cart is empty</p>
                  <p className="text-muted-foreground mb-6">
                    Add some delicious items from {slug}&apos;s menu
                  </p>
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => {
                      setStep(2);
                    }}
                  >
                    Browse Menu
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
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
                              : "opacity-80 grayscale",
                          )}
                        />
                      ) : (
                        <div
                          className={cn(
                            "flex items-center justify-center bg-muted w-16 h-16 rounded-lg",
                            item.isAvailable
                              ? "opacity-100"
                              : "opacity-80 grayscale",
                          )}
                        >
                          <IconSalad className="size-5" />
                        </div>
                      )}
                      <div className="flex flex-1 items-center">
                        <div
                          className={cn(
                            "flex-1 min-w-0",
                            item.isAvailable
                              ? "opacity-100"
                              : "opacity-80 grayscale",
                          )}
                        >
                          <div className="flex items-center space-x-2">
                            <VegNonVegTooltip
                              foodType={item.foodType}
                              innerClassName="size-1"
                            />
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
                              ₹
                              {(item.discountedPrice * item.quantity).toFixed(
                                2,
                              )}
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
                    {taxDetails &&
                      !taxDetails.isTaxIncludedInPrice &&
                      taxDetails.taxLabel && (
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
                </CardContent>
              </Card>
              <Card className="mb-18 gap-4">
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
            </div>
          ))}
      </div>

      <div className="h-[6rem] sm:h-[4rem]"></div>

      <div
        className={cn(
          "bg-background rounded-b-lg border-t p-4 flex items-center justify-between sm:justify-between flex-col-reverse gap-2 sm:flex-row fixed bottom-0 left-0 right-0 z-15",
          footerClassName,
        )}
      >
        {step === 1 && (
          <>
            <Button
              onClick={handleClose}
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              type="button"
              disabled={!tableId}
              onClick={() => setStep(2)}
              className="w-full sm:w-auto"
            >
              Go to Menu
            </Button>
          </>
        )}
        {step === 2 && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="w-full sm:w-auto"
            >
              Go back to Tables
            </Button>
            <Button
              type="button"
              disabled={cartItems.length === 0}
              onClick={() => setStep(3)}
              className="w-full sm:w-auto"
            >
              View Cart (
              {cartItems.reduce((acc, item) => acc + item.quantity, 0)})
            </Button>
          </>
        )}
        {step === 3 && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(2)}
              className="w-full sm:w-auto"
            >
              Go back to Menu
            </Button>
            <Button
              type="button"
              onClick={confirmOrder}
              className="w-full sm:w-auto"
            >
              Place Order
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default FoodOrderStepsForStaffs;
