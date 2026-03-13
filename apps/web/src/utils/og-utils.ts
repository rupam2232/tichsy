import type { Metadata } from "next";
import { getOptimizedUrl } from "./imageOptimizer";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Supported OG image page types.
 */
export type OgPage = "overview" | "menu" | "cart" | "my-orders" | "bill" | "order";

/**
 * Builds a URL to the dynamic OG image API endpoint.
 */
export function buildOgImageUrl(
  slug: string,
  page: OgPage,
  extraParams?: Record<string, string>,
): URL {
  const url = new URL("/api/og", APP_URL);
  url.searchParams.set("slug", slug);
  url.searchParams.set("page", page);
  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      url.searchParams.set(key, value);
    }
  }
  return url;
}

/**
 * Generates favicon/icon metadata from a restaurant logo URL.
 * Falls back to the default site favicon.
 */
export function getRestaurantIcons(logoUrl?: string): Metadata["icons"] {
  if (!logoUrl) {
    return [{ rel: "icon", url: `${APP_URL}/favicon.ico` }];
  }
  return [
    {
      rel: "icon",
      url: getOptimizedUrl(logoUrl, 16, 16, "r_max") || "",
      sizes: "16x16",
      type: "image/png",
    },
    {
      rel: "icon",
      url: getOptimizedUrl(logoUrl, 32, 32, "r_max") || "",
      sizes: "32x32",
      type: "image/png",
    },
    {
      rel: "icon",
      url: getOptimizedUrl(logoUrl, 96, 96, "r_max") || "",
      sizes: "96x96",
      type: "image/png",
    },
  ];
}

/**
 * Shared "not found" metadata fallback.
 */
export function notFoundMeta(): Metadata {
  return {
    title: "Page not found",
    description:
      "Sorry, we couldn't find the page you're looking for. It might have been removed, had its name changed, or is temporarily unavailable.",
  };
}
