"use client";
import { useRouter, useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import axios from "@/utils/axiosInstance";
import type { AxiosError } from "axios";
import { ApiResponse, AllTables } from "@repo/types";
import { useDispatch, useSelector } from "react-redux";
import { signOut } from "@/store/authSlice";
import { cn } from "@repo/ui/lib/utils";
import ClinetFoodMenu from "@/components/features/menu/food-menu";
import { useCart } from "@/hooks/useCart";
import { Skeleton } from "@repo/ui/components/skeleton";
import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { Check } from "lucide-react";
import { RootState } from "@/store/store";
import CartView, { CartViewHandle } from "@/components/features/cart/cart-view";

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<CartViewHandle>(null);

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

  const { syncCart, cartItems } = useCart(slug);

  useEffect(() => {
    if (slug) {
      syncCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [step]);

  const confirmOrder = async () => {
    if (cartRef.current) {
      await cartRef.current.confirmOrder();
    }
  };

  const onOrderSuccess = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
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
        "flex flex-col h-full @container/food-order-steps-for-staffs relative",
        className,
      )}
    >
      <div
        ref={scrollContainerRef}
        className="flex-1 px-6 custom-scrollbar overflow-y-auto pt-2 pb-10"
      >
        {step === 1 && (
          <>
            {isTablePageLoading ? (
              <div className="grid grid-cols-2 @lg/food-order-steps-for-staffs:grid-cols-3 @2xl/food-order-steps-for-staffs:grid-cols-4 gap-3 px-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="min-h-25 w-full" />
                ))}
              </div>
            ) : allTables && allTables.tables.length > 0 ? (
              <div className="grid grid-cols-2 @lg/food-order-steps-for-staffs:grid-cols-3 @2xl/food-order-steps-for-staffs:grid-cols-4 gap-3 px-2">
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
                        "rounded-md p-3 flex flex-col items-center justify-center text-sm truncate min-h-25 shadow border",
                        t.isOccupied
                          ? "bg-red-200 dark:bg-red-100 text-red-900 dark:text-red-700"
                          : "bg-green-200 dark:bg-green-100 text-green-900 dark:text-green-700",
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
                {activeRestaurant?.userRole === "owner" && (
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
          className={cn("m-0!", step !== 2 && "hidden")}
        />
        {step === 3 && (
          <CartView
            ref={cartRef}
            slug={slug}
            tableId={tableId}
            isStaff={true}
            onSuccess={onOrderSuccess}
            onBrowseMenu={() => setStep(2)}
          />
        )}
      </div>

      {/* <div className="h-[6rem]"></div> */}

      <div
        className={cn(
          "bg-background rounded-b-lg border-t p-4 flex items-center justify-between sm:justify-between flex-col-reverse gap-2 sm:flex-row relative",
          footerClassName,
        )}
      >
        <div className="h-8 w-full bg-gradient-to-t from-background to-transparent absolute top-0 left-0 right-0 -translate-y-full" />
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
