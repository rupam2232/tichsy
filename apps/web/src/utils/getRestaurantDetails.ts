import axios from "@/utils/axiosInstance";
import { RestaurantFullInfo } from "@repo/ui/types/Restaurant";
import { AxiosError } from "axios";
import { ApiResponse } from "@repo/ui/types/ApiResponse";

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
