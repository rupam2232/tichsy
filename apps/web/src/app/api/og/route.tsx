import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import type { RestaurantMinimalInfo } from "@repo/types";

export const runtime = "edge";

// Cache for 24 hours
export const revalidate = 86400;

const WIDTH = 1200;
const HEIGHT = 630;

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

/**
 * Fetch restaurant data using native fetch (edge-compatible, no cookies needed).
 */
async function fetchRestaurant(
  slug: string,
): Promise<RestaurantMinimalInfo | null> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/restaurant/${slug}?forMetaData=true`,
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const slug = searchParams.get("slug");

    if (!slug) {
      return new Response("Missing slug parameter", { status: 400 });
    }

    const restaurant = await fetchRestaurant(slug);

    if (!restaurant) {
      return new Response("Restaurant not found", { status: 404 });
    }

    const { restaurantName, description, address, isCurrentlyOpen, logoUrl } =
      restaurant;

    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            position: "relative",
            display: "flex",
            fontFamily: "Inter, sans-serif",
            color: "white",
            overflow: "hidden",
            backgroundImage: `radial-gradient(rgba(0,0,0,0.6) 25%, rgba(0,0,0,0.3) 65%, rgba(0,0,0,0.5)), url(http://localhost:3000/food-background-01.png)`,
            textShadow: "0 6px 30px rgba(0,0,0,0.7)",
          }}
        >
          {/* Content */}
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "60px",
              width: "100%",
            }}
          >
            {/* Center */}
            <div
              style={{
                textAlign: "center",
                display: "flex",
                flex: 1,
                justifyContent: "center",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontSize: 82,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                {logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt={restaurantName}
                    style={{
                      width: 80,
                      height: 80,
                      objectFit: "cover",
                      borderRadius: "100%",
                    }}
                  />
                )}

                {restaurantName.length > 24
                  ? restaurantName.slice(0, 24) + "…"
                  : restaurantName}
              </div>

              <div
                style={{
                  display: "block",
                  fontSize: 25,
                  opacity: 0.9,
                  lineClamp: 2,
                }}
              >
                {description}
              </div>
            </div>

            {/* Bottom */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                gap: "20px",
                fontSize: 26,
              }}
            >
              <div
                style={{
                  maxWidth: "50%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                  fontSize: 20,
                }}
              >
                {address ? `📍 ${address}` : ""}
                <br />
                {isCurrentlyOpen !== undefined ? (
                  <span>🕒 {isCurrentlyOpen ? "Open Now" : "Closed"}</span>
                ) : (
                  ""
                )}
              </div>

              <div
                style={{
                  opacity: 0.9,
                  display: "flex",
                  fontSize: 20,
                }}
              >
                Powered by
                <span
                  style={{
                    color: "#72e3ad",
                    fontWeight: 700,
                    marginLeft: "10px",
                  }}
                >
                  Tichsy
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: WIDTH,
        height: HEIGHT,
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      },
    );
  } catch (error) {
    console.log(error);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
