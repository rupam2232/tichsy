"use client";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerTitle,
  DrawerTrigger,
} from "@repo/ui/components/drawer";
import {
  useParams,
  useRouter,
  useSearchParams,
  usePathname,
} from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { cn } from "@repo/ui/lib/utils";
import { useEffect, useState, useRef } from "react";
import { useCart } from "@/hooks/useCart";
import { fetchRestaurantMetadata } from "@/utils/fetchRestaurantMetadata";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { addOrder } from "@/store/orderHistorySlice";
import CartView, {
  CartViewHandle,
  OrderSuccessData,
} from "@/components/features/cart/cart-view";
import { ApiResponse } from "@repo/types";

const CheckoutModalPage = () => {
  const router = useRouter();
  const { slug: restaurantSlug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const tableId = searchParams.get("tableId");
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState<boolean>(
    pathname.includes("cart"),
  );
  const cartRef = useRef<CartViewHandle>(null);
  const { cartItems } = useCart(restaurantSlug);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    let isMounted = true;
    const previousTitle = document.title;

    if (drawerOpen) {
      fetchRestaurantMetadata(restaurantSlug).then((restaurant) => {
        if (isMounted) {
          document.title = `Cart | ${restaurant?.restaurantName}`;
        }
      });
    }

    return () => {
      document.title = previousTitle;
      isMounted = false;
    };
  }, [restaurantSlug, drawerOpen]);

  const onOrderSuccess = (response: ApiResponse<OrderSuccessData>) => {
    if (response.data?.order?._id) {
      dispatch(
        addOrder({
          restaurantSlug: restaurantSlug,
          orderId: response.data.order._id,
        }),
      );
    }
    router.replace(`/${restaurantSlug}/my-orders`);
    setDrawerOpen(false);
  };

  const confirmOrder = async () => {
    if (cartRef.current) {
      await cartRef.current.confirmOrder();
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
        <div className="w-full md:mx-auto md:w-2xl lg:w-3xl h-full relative">
          <DrawerTitle className="px-6 pb-2 border-b text-lg">Cart</DrawerTitle>
          <ScrollArea className="h-full" scrollbarClassName="hidden" scrollbarThumbClassName="hidden">
            <div className="px-6 py-4">
              <CartView
                ref={cartRef}
                slug={restaurantSlug}
                tableId={tableId}
                onSuccess={onOrderSuccess}
              />
              <div className="h-50" />
            </div>
          </ScrollArea>
        </div>
        <DrawerFooter className="sticky bottom-0 left-0 right-0 p-4 border-t backdrop-blur-lg bg-background/40 w-full md:mx-auto md:w-2xl lg:w-3xl">
          <div className="h-8 w-full bg-gradient-to-t from-background to-transparent absolute top-0 left-0 right-0 -translate-y-full" />
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

export default CheckoutModalPage;
