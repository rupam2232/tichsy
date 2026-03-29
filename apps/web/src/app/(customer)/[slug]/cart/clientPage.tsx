"use client";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useRef } from "react";
import { Button } from "@repo/ui/components/button";
import { ChevronLeft } from "lucide-react";
import { useDispatch } from "react-redux";
import { useCart } from "@/hooks/useCart";
import { AppDispatch } from "@/store/store";
import { addOrder } from "@/store/orderHistorySlice";
import { ApiResponse } from "@repo/types";
import CartView, { CartViewHandle, OrderSuccessData } from "@/components/features/cart/cart-view";

const CheckoutClientPage = () => {
  const { slug: restaurantSlug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const tableId = searchParams.get("tableId");
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const cartRef = useRef<CartViewHandle>(null);

  const { cartItems } = useCart(restaurantSlug);

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
  };

  const confirmOrder = async () => {
    if (cartRef.current) {
      await cartRef.current.confirmOrder();
    }
  };

  return (
    <section className="max-w-2xl mx-auto px-4 pt-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 pl-0! bg-transparent! hover:bg-transparent! group"
          onClick={() => router.back()}
        >
          <ChevronLeft className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Menu
        </Button>
        <h1 className="text-3xl font-bold">Cart</h1>
      </div>

      <CartView
        ref={cartRef}
        slug={restaurantSlug}
        tableId={tableId}
        onSuccess={onOrderSuccess}
        onBrowseMenu={() => router.push(`/${restaurantSlug}/menu?tableId=${tableId}`)}
      />

      {cartItems.length > 0 && (
        <div className="space-y-2 sticky bottom-0 left-0 right-0 p-4 backdrop-blur-lg bg-background/40 max-w-2xl mx-auto mt-10">
          <div className="h-8 w-full bg-gradient-to-t from-background to-transparent absolute top-0 left-0 right-0 -translate-y-full" />
          <Button
            className="w-full transition-colors"
            disabled={cartItems.some((item) => item.isAvailable === false)}
            onClick={confirmOrder}
          >
            Confirm Order
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push(`/${restaurantSlug}/menu?tableId=${tableId}`)}
          >
            Continue Shopping
          </Button>
        </div>
      )}
    </section>
  );
};

export default CheckoutClientPage;
