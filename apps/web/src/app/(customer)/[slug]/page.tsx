import { fetchRestaurantMetadata } from "@/utils/fetchRestaurantMetadata";
import { getRestaurantDetails } from "@/utils/getRestaurantDetails";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent } from "@repo/ui/components/card";
import { Clock, MapPin, Store } from "lucide-react";
import { Metadata } from "next";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await fetchRestaurantMetadata(slug);

  if (!restaurant) {
    return {
      title: "Restaurant not found",
      description: "The requested restaurant could not be found.",
    };
  }

  return {
    title: `${restaurant.restaurantName}`,
    description:
      restaurant.description ||
      `Welcome to ${restaurant.restaurantName}. Check our opening hours and location.`,
    icons: [
      {
        rel: "icon",
        url:
          restaurant.logoUrl?.replace("/upload/", "/upload/r_max/") ||
          `${process.env.NEXT_PUBLIC_CLIENT_BASE_URL}/favicon.ico`,
      },
    ],
  };
}

export default async function RestaurantPage({ params }: Props) {
  const { slug } = await params;
  const restaurant = await getRestaurantDetails(slug);

  if (!restaurant) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <Card className="overflow-hidden shadow-lg border-border/50 pt-0">
        {/* Hero Section with Gradient */}
        <div className="h-56 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/5 relative">
          <div className="absolute inset-0 -z-10" />
          <div className="absolute -bottom-16 left-8 md:left-12">
            <div className="relative rounded-full p-1 bg-background shadow-xl">
              <Avatar className="w-32 h-32 md:w-40 md:h-40">
                <AvatarImage
                  src={restaurant.logoUrl}
                  alt={`${restaurant.restaurantName} Logo`}
                  className="object-cover"
                />
                <AvatarFallback className="text-4xl font-bold text-muted-foreground">
                  {restaurant.restaurantName
                    .split(" ")
                    .map((word) => word[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        <CardContent className="pt-20 px-8 pb-10 space-y-10">
          {/* Header / Title Section */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
                {restaurant.restaurantName}
              </h1>

              <Badge
                variant={restaurant.isCurrentlyOpen ? "success" : "destructive"}
                className="px-4 py-1.5 text-sm uppercase tracking-wide font-semibold shadow-sm"
              >
                {restaurant.isCurrentlyOpen ? "Open Now" : "Closed"}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {restaurant.categories?.map((cat, index) => (
                <Badge key={cat + index} variant="secondary">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-border/60" />

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Left Column: Description & Address */}
            <div className="md:col-span-2 space-y-8">
              <div className="space-y-3">
                <h2 className="text-xl font-bold flex items-center gap-2 text-foreground/90">
                  <Store className="size-5" />
                  About Us
                </h2>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {restaurant.description ||
                    "Welcome! We haven't added a description yet, but we promise our service speaks for itself."}
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-bold flex items-center gap-2 text-foreground/90">
                  <MapPin className="size-5" />
                  Location
                </h2>
                <p className="text-muted-foreground text-lg">
                  {restaurant.address || "Address unavailable"}
                </p>
              </div>
            </div>

            {/* Right Column: Hours & Info */}
            <div className="md:col-span-1">
              <div className="bg-muted/30 rounded-2xl p-6 space-y-5 border border-border/50">
                <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
                  <Clock className="size-5" />
                  Opening Hours
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center pb-2 border-b border-border/50">
                    <span className="text-muted-foreground font-medium">
                      Status
                    </span>
                    <span
                      className={
                        restaurant.isCurrentlyOpen
                          ? "text-green-600 font-bold"
                          : "text-red-600 font-bold"
                      }
                    >
                      {restaurant.isCurrentlyOpen ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground">Opens at</span>
                    <span className="font-mono font-semibold text-foreground">
                      {restaurant.openingTime || "--:--"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground">Closes at</span>
                    <span className="font-mono font-semibold text-foreground">
                      {restaurant.closingTime || "--:--"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
