import axios from "@/utils/axiosInstance";
import { RestaurantFullInfo, ApiResponse } from "@repo/types";
import { AxiosError } from "axios";

export async function getRestaurantDetails(
  slug: string,
): Promise<RestaurantFullInfo | null> {
  try {
    const response = await axios.get(`/restaurant/${slug}`);
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiResponse>;
    console.error(
      `Failed to fetch restaurant details: ${axiosError.response?.data.message || axiosError.message}`,
    );
    return null;
  }
}
