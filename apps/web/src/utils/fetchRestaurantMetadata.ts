import type { AxiosError } from "axios";
import type { ApiResponse, RestaurantMinimalInfo } from "@repo/types";
import axios from "@/utils/axiosInstance";
import { createRestaurantSchema } from "@repo/types";

export async function fetchRestaurantMetadata(
  slug: string,
): Promise<RestaurantMinimalInfo | null> {
  const slugSchema = createRestaurantSchema.shape.slug;
  const result = slugSchema.safeParse(slug);
  if (!result.success) {
    return null;
  }
  try {
    const response = await axios.get(`/restaurant/${slug}?forMetaData=true`);
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiResponse>;
    console.error(axiosError.response?.data.message || axiosError.message);
    return null;
  }
}
