"use client";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/store/store";
import axios from "@/utils/axiosInstance";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { ApiResponse, RestaurantMinimalInfo } from "@repo/types";
import { useCallback, useEffect, useState, useRef } from "react";
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
import { useRouter } from "next/navigation";
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
import { getOptimizedUrl } from "@/utils/imageOptimizer";
import { Skeleton } from "@repo/ui/components/skeleton";
import { cn } from "@repo/ui/lib/utils";

export default function ClientPage({from}: {from?: string}) {
  const user = useSelector((state: RootState) => state.auth.user);
  const [isOwnedLoading, setIsOwnedLoading] = useState<boolean>(true);
  const [ownedRestaurants, setOwnedRestaurants] = useState<
    RestaurantMinimalInfo[]
  >([]);
  const [ownedPage, setOwnedPage] = useState<number>(1);
  const [hasMoreOwned, setHasMoreOwned] = useState<boolean>(true);
  const [isOwnedChanging, setIsOwnedChanging] = useState<boolean>(false);
  const ownedObserver = useRef<IntersectionObserver>(null);

  const [isJoinedLoading, setIsJoinedLoading] = useState<boolean>(true);
  const [staffRestaurants, setStaffRestaurants] = useState<
    RestaurantMinimalInfo[]
  >([]);
  const [joinedPage, setJoinedPage] = useState<number>(1);
  const [hasMoreJoined, setHasMoreJoined] = useState<boolean>(true);
  const [isJoinedChanging, setIsJoinedChanging] = useState<boolean>(false);
  const joinedObserver = useRef<IntersectionObserver>(null);

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const fetchOwnedRestaurants = useCallback(async () => {
    if (!hasMoreOwned && ownedPage !== 1) return;

    if (ownedPage === 1) setIsOwnedLoading(true);
    else setIsOwnedChanging(true);

    try {
      const response = await axios.get("/restaurant/owned", {
        params: { page: ownedPage, limit: 12 },
      });
      if (response.data.success) {
        const newOwned = response.data.data.restaurants;
        const newHasNextPage = response.data.data.hasNextPage;

        if (ownedPage === 1) {
          setOwnedRestaurants(newOwned);
        } else {
          setOwnedRestaurants((prev) => [...prev, ...newOwned]);
        }
        setHasMoreOwned(newHasNextPage);
        dispatch(setActiveRestaurant(null));
      } else {
        toast.error(
          response.data.message || "Failed to fetch owned restaurants",
        );
      }
    } catch (error) {
      console.error("Error fetching owned restaurants:", error);
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Failed to fetch owned restaurants",
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push("/signin");
      }
    } finally {
      setIsOwnedLoading(false);
      setIsOwnedChanging(false);
    }
  }, [ownedPage, dispatch, router, hasMoreOwned]);

  const fetchJoinedRestaurants = useCallback(async () => {
    if (!hasMoreJoined && joinedPage !== 1) return;

    if (joinedPage === 1) setIsJoinedLoading(true);
    else setIsJoinedChanging(true);

    try {
      const response = await axios.get("/restaurant/joined", {
        params: { page: joinedPage, limit: 12 },
      });
      if (response.data.success) {
        const newJoined = response.data.data.restaurants;
        const newHasNextPage = response.data.data.hasNextPage;

        if (joinedPage === 1) {
          setStaffRestaurants(newJoined);
        } else {
          setStaffRestaurants((prev) => [...prev, ...newJoined]);
        }
        setHasMoreJoined(newHasNextPage);
        dispatch(setActiveRestaurant(null));
      } else {
        toast.error(
          response.data.message || "Failed to fetch joined restaurants",
        );
      }
    } catch (error) {
      console.error("Error fetching joined restaurants:", error);
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Failed to fetch joined restaurants",
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push("/signin");
      }
    } finally {
      setIsJoinedLoading(false);
      setIsJoinedChanging(false);
    }
  }, [joinedPage, dispatch, router, hasMoreJoined]);

  const lastOwnedElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (ownedObserver.current) ownedObserver.current.disconnect();
      ownedObserver.current = new IntersectionObserver((entries) => {
        if (entries && Array.isArray(entries) && entries[0]?.isIntersecting) {
          if (hasMoreOwned && !isOwnedChanging && !isOwnedLoading) {
            setOwnedPage((prev) => prev + 1);
          }
        }
      });
      if (node) ownedObserver.current.observe(node);
    },
    [hasMoreOwned, isOwnedChanging, isOwnedLoading],
  );

  const lastJoinedElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (joinedObserver.current) joinedObserver.current.disconnect();
      joinedObserver.current = new IntersectionObserver((entries) => {
        if (entries && Array.isArray(entries) && entries[0]?.isIntersecting) {
          if (hasMoreJoined && !isJoinedChanging && !isJoinedLoading) {
            setJoinedPage((prev) => prev + 1);
          }
        }
      });
      if (node) joinedObserver.current.observe(node);
    },
    [hasMoreJoined, isJoinedChanging, isJoinedLoading],
  );

  useEffect(() => {
    if (!user) {
      setIsOwnedLoading(false);
      setIsJoinedLoading(false);
      dispatch(signOut());
      router.push("/signin");
    } else {
      fetchOwnedRestaurants();
    }
  }, [user, ownedPage, dispatch, router, fetchOwnedRestaurants]);

  useEffect(() => {
    if (user) {
      fetchJoinedRestaurants();
    }
  }, [user, joinedPage, fetchJoinedRestaurants]);

  useEffect(() => {
    const combined = [...ownedRestaurants, ...staffRestaurants];
    dispatch(
      setAllRestaurants(
        combined.map((restaurant: RestaurantMinimalInfo) => ({
          _id: restaurant._id,
          restaurantName: restaurant.restaurantName,
          slug: restaurant.slug,
        })),
      ),
    );
  }, [ownedRestaurants, staffRestaurants, dispatch]);

  return (
    <section className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6">
      <div className="flex items-start justify-between">
        <p className="text-muted-foreground px-4 lg:px-6">
          {from === "signup"
            ? `Welcome to Tichsy, ${user?.firstName ?? "User"}!`
            : `Welcome back, ${user?.firstName ?? "User"}!`}
        </p>
        <div className="px-4 lg:px-6">
          <CreateRestaurantDialog
            setOwnersRestaurant={setOwnedRestaurants}
            isLoading={isOwnedLoading && isJoinedLoading}
          >
            <Plus /> New Restaurant
          </CreateRestaurantDialog>
        </div>
      </div>
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        {isOwnedLoading && isJoinedLoading ? (
          <div className="grid grid-cols-1 @xl/main:grid-cols-2 @3xl/main:grid-cols-3 @5xl/main:grid-cols-4 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton
                key={index}
                className={cn(
                  "h-52 rounded-md",
                  index > 0 ? `delay-${(index + 1) * 100}` : "",
                )}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-8 w-full">
            {ownedRestaurants.length > 0 || staffRestaurants.length > 0 ? (
              <>
                {ownedRestaurants.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-medium tracking-tight">
                      My Restaurants
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Restaurants you own and manage
                    </p>
                    <div className="grid grid-cols-1 @xl/main:grid-cols-2 @3xl/main:grid-cols-3 @5xl/main:grid-cols-4 gap-4 text-center animate-in fade-in slide-in-from-top-4 duration-500 mt-3">
                      {ownedRestaurants.map((restaurant, index) => (
                        <Card
                          key={restaurant._id}
                          className="@container/card"
                          ref={
                            index === ownedRestaurants.length - 1
                              ? lastOwnedElementRef
                              : null
                          }
                        >
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
                          <div className="flex flex-col items-center w-full gap-4 pb-6">
                            <Avatar className="w-15 h-15">
                              <AvatarImage
                                src={getOptimizedUrl(
                                  restaurant.logoUrl,
                                  150,
                                  150,
                                  "r_max",
                                )}
                                alt={`${restaurant.restaurantName} Logo`}
                                className="object-cover"
                                loading="lazy"
                                draggable={false}
                              />
                              <AvatarFallback className="font-medium">
                                {restaurant?.restaurantName
                                  ?.split(" ")
                                  .map((word) => word[0])
                                  .slice(0, 2)
                                  .join("")
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
                                      _id: restaurant._id,
                                      restaurantName: restaurant.restaurantName,
                                      slug: restaurant.slug,
                                      logoUrl: restaurant.logoUrl,
                                      isCurrentlyOpen:
                                        restaurant.isCurrentlyOpen,
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
                      {isOwnedChanging &&
                        Array.from({ length: 4 }).map((_, index) => (
                          <Skeleton
                            key={index}
                            className={cn(
                              "rounded-md",
                              index > 0 ? `delay-${(index + 1) * 100}` : "",
                            )}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {staffRestaurants.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2">
                    <h2 className="text-2xl font-medium tracking-tight">
                      Joined Restaurants
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Restaurants you manage as staff
                    </p>
                    <div className="grid grid-cols-1 @xl/main:grid-cols-2 @3xl/main:grid-cols-3 @5xl/main:grid-cols-4 gap-4 text-center animate-in fade-in slide-in-from-top-4 duration-500 mt-3">
                      {staffRestaurants.map((staffsrestaurant, index) => (
                        <Card
                          key={staffsrestaurant._id}
                          className="@container/card"
                          ref={
                            index === staffRestaurants.length - 1
                              ? lastJoinedElementRef
                              : null
                          }
                        >
                          <CardHeader>
                            {staffsrestaurant.isArchived && (
                              <Badge variant="destructive" className="ml-auto">
                                Archived
                              </Badge>
                            )}
                            <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl line-clamp-2">
                              {staffsrestaurant.restaurantName}
                            </CardTitle>
                            <CardDescription className="line-clamp-2">
                              {staffsrestaurant.description}
                            </CardDescription>
                          </CardHeader>
                          <div className="flex flex-col items-center w-full gap-4 pb-6">
                            <Avatar className="w-15 h-15">
                              <AvatarImage
                                src={getOptimizedUrl(
                                  staffsrestaurant.logoUrl,
                                  150,
                                  150,
                                  "r_max",
                                )}
                                alt={`${staffsrestaurant.restaurantName} Logo`}
                                className="object-cover"
                                loading="lazy"
                                draggable={false}
                              />
                              <AvatarFallback className="font-medium">
                                {staffsrestaurant?.restaurantName
                                  ?.split(" ")
                                  .map((word) => word[0])
                                  .slice(0, 2)
                                  .join("")
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
                                      restaurantName:
                                        staffsrestaurant.restaurantName,
                                      slug: staffsrestaurant.slug,
                                      logoUrl: staffsrestaurant.logoUrl,
                                      isCurrentlyOpen:
                                        staffsrestaurant.isCurrentlyOpen,
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
                      ))}
                      {isJoinedChanging &&
                        Array.from({ length: 4 }).map((_, index) => (
                          <Skeleton
                            key={index}
                            className={cn(
                              "rounded-md",
                              index > 0 ? `delay-${(index + 1) * 100}` : "",
                            )}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Empty className="animate-in fade-in slide-in-from-top-4 duration-500">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="size-9">
                    <Store className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>No restaurants found</EmptyTitle>
                  <EmptyDescription>
                    You have not created any restaurants and are not assigned to
                    any. Get started by creating a new restaurant.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <CreateRestaurantDialog
                    setOwnersRestaurant={setOwnedRestaurants}
                    isLoading={isOwnedLoading && isJoinedLoading}
                  >
                    Create Restaurant
                  </CreateRestaurantDialog>
                </EmptyContent>
              </Empty>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
