"use client";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/store/store";
import axios from "@/utils/axiosInstance";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { ApiResponse, RestaurantMinimalInfo } from "@repo/types";
import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Button } from "@repo/ui/components/button";
import { signOut } from "@/store/authSlice";
import {
  setAllRestaurants,
  setActiveRestaurant,
} from "@/store/restaurantSlice";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import CreateRestaurantDialog from "@/components/features/restaurant/create-restaurant-dialog";
import { Plus, Store } from "lucide-react";
import { Badge } from "@repo/ui/components/badge";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/ui/components/empty";

export default function ClientPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [ownersRestaurant, setOwnersRestaurant] = useState<
    RestaurantMinimalInfo[]
  >([]);
  const [staffsrestaurant, setStaffsRestaurant] =
    useState<RestaurantMinimalInfo | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const fetchOwnersRestaurants = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/restaurant/owner");
      if (response.data.success) {
        setOwnersRestaurant(response.data.data);
        dispatch(
          setAllRestaurants(
            response.data.data.map((restaurant: RestaurantMinimalInfo) => ({
              _id: restaurant._id,
              restaurantName: restaurant.restaurantName,
              slug: restaurant.slug,
            })),
          ),
        );
        dispatch(setActiveRestaurant(null));
        setStaffsRestaurant(null);
      } else {
        toast.error(
          response.data.message || "Failed to fetch owner's restaurants",
        );
      }
    } catch (error) {
      console.error("Error fetching owner's restaurants:", error);
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Failed to fetch owner's restaurants",
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push("/signin");
      }
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, router]);

  const fetchStaffsRestaurant = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/restaurant/staff");
      if (response.data.success) {
        setStaffsRestaurant(response.data.data);
        dispatch(
          setAllRestaurants([
            {
              _id: response.data.data._id,
              restaurantName: response.data.data.restaurantName,
              slug: response.data.data.slug,
            },
          ]),
        );
        dispatch(setActiveRestaurant(null));
        setOwnersRestaurant([]);
      } else {
        toast.error(
          response.data.message || "Failed to fetch staff's restaurants",
        );
      }
    } catch (error) {
      console.error("Error fetching staff's restaurants:", error);
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Failed to fetch staff's restaurants",
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push("/signin");
      }
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, router]);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      dispatch(signOut());
      router.push("/signin");
    } else if (user.role === "owner") {
      fetchOwnersRestaurants();
    } else if (user.role === "staff") {
      fetchStaffsRestaurant();
    }
  }, [user, fetchOwnersRestaurants, fetchStaffsRestaurant, dispatch, router]);

  return (
    <section className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6">
      <div className="flex items-start justify-between">
        <p className="text-muted-foreground px-4 lg:px-6">
          {from === "signup"
            ? `Welcome to ${process.env.NEXT_PUBLIC_APP_NAME}, ${user?.firstName ?? "User"}!`
            : `Welcome back, ${user?.firstName ?? "User"}!`}
        </p>
        {user?.role === "owner" && (
          <div className="px-4 lg:px-6">
            <CreateRestaurantDialog
              setOwnersRestaurant={setOwnersRestaurant}
              isLoading={isLoading}
            >
              <Plus /> New Restaurant
            </CreateRestaurantDialog>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        {isLoading ? (
          <div className="grid grid-cols-1 @xl/main:grid-cols-2 @3xl/main:grid-cols-3 @5xl/main:grid-cols-4 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className={`animate-pulse ${index > 0 ? `delay-${(index + 1) * 100}` : ""} h-52 border border-accent shadow-md rounded-md flex flex-col items-center justify-between p-4`}
              >
                <div className="flex flex-col items-center gap-2 w-full">
                  <div className="animate-pulse bg-accent h-6 w-full rounded-md"></div>
                  <div className="animate-pulse bg-accent h-4 w-4/5 rounded-md"></div>
                </div>
                <div className="animate-pulse bg-accent h-15 w-15 rounded-full"></div>
                <div className="animate-pulse bg-accent h-8 w-2/3 rounded-md"></div>
              </div>
            ))}
          </div>
        ) : user?.role === "owner" ? (
          ownersRestaurant.length > 0 ? (
            <div className="grid grid-cols-1 @xl/main:grid-cols-2 @3xl/main:grid-cols-3 @5xl/main:grid-cols-4 gap-4 text-center animate-in fade-in slide-in-from-top-4 duration-500">
              {ownersRestaurant.map((restaurant) => (
                <Card key={restaurant._id} className="@container/card">
                  <CardHeader>
                    {restaurant.isArchived && (
                      <Badge variant="destructive" className="ml-auto">
                        Archived
                      </Badge>
                    )}
                    <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl line-clamp-2">
                      {restaurant.restaurantName}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {restaurant.description}
                    </CardDescription>
                  </CardHeader>
                  <div className="flex flex-col items-center w-full gap-4">
                    <Avatar className="w-15 h-15">
                      <AvatarImage
                        src={restaurant.logoUrl}
                        alt={`${restaurant.restaurantName} Logo`}
                        className="object-cover"
                        loading="lazy"
                        draggable={false}
                      />
                      <AvatarFallback>
                        {restaurant?.restaurantName?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <CardAction className="self-auto">
                      <Button
                        variant="outline"
                        className="text-sm"
                        onClick={async () => {
                          dispatch(
                            setActiveRestaurant({
                              _id: restaurant._id,
                              restaurantName: restaurant.restaurantName,
                              slug: restaurant.slug,
                              logoUrl: restaurant.logoUrl,
                              isCurrentlyOpen: restaurant.isCurrentlyOpen,
                            }),
                          );
                          router.push(
                            `/restaurant/${restaurant.slug}/dashboard`,
                          );
                        }}
                      >
                        Manage Restaurant
                      </Button>
                    </CardAction>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Empty className="animate-in fade-in slide-in-from-top-4 duration-500">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="size-9">
                  <Store className="size-4" />
                </EmptyMedia>
                <EmptyTitle>No restaurants found</EmptyTitle>
                <EmptyDescription>
                  You have not created any restaurants yet. Get started by
                  creating a new restaurant
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <CreateRestaurantDialog
                  setOwnersRestaurant={setOwnersRestaurant}
                  isLoading={isLoading}
                >
                  Create Restaurant
                </CreateRestaurantDialog>
              </EmptyContent>
            </Empty>
          )
        ) : user?.role === "staff" && staffsrestaurant ? (
          <div className="grid grid-cols-1 @xl/main:grid-cols-2 @3xl/main:grid-cols-3 @5xl/main:grid-cols-4 gap-4 text-center animate-in fade-in slide-in-from-top-4 duration-500">
            <Card className="@container/card">
              {staffsrestaurant.isArchived && (
                <Badge variant="destructive" className="ml-auto">
                  Archived
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl line-clamp-2">
                  {staffsrestaurant.restaurantName}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {staffsrestaurant.description}
                </CardDescription>
              </CardHeader>
              <div className="flex flex-col items-center w-full gap-4">
                <Avatar className="w-15 h-15">
                  <AvatarImage
                    src={staffsrestaurant.logoUrl}
                    alt={`${staffsrestaurant.restaurantName} Logo`}
                    className="object-cover"
                    loading="lazy"
                    draggable={false}
                  />
                  <AvatarFallback>
                    {staffsrestaurant?.restaurantName
                      ?.slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <CardAction className="self-auto">
                  <Button
                    variant="outline"
                    className="text-sm"
                    onClick={async () => {
                      dispatch(
                        setActiveRestaurant({
                          _id: staffsrestaurant._id,
                          restaurantName: staffsrestaurant.restaurantName,
                          slug: staffsrestaurant.slug,
                          logoUrl: staffsrestaurant.logoUrl,
                          isCurrentlyOpen: staffsrestaurant.isCurrentlyOpen,
                        }),
                      );
                      router.push(
                        `/restaurant/${staffsrestaurant.slug}/dashboard`,
                      );
                    }}
                  >
                    Manage Restaurant
                  </Button>
                </CardAction>
              </div>
            </Card>
          </div>
        ) : (
          <Empty className="animate-in fade-in slide-in-from-top-4 duration-500">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="size-9">
                <Store className="size-4" />
              </EmptyMedia>
              <EmptyTitle>No restaurants found</EmptyTitle>
              <EmptyDescription>
                You are not assigned to any restaurant yet. Please contact your
                manager or owner to get assigned to a restaurant
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </section>
  );
}
