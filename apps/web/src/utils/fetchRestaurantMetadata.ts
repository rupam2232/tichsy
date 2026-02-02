import type { AxiosError } from "axios";
import type { ApiResponse } from "@repo/ui/types/ApiResponse";
import axios from "@/utils/axiosInstance";

export async function fetchRestaurantMetadata(slug: string) {
  try {
    const response = await axios.get(`/restaurant/${slug}?forMetaData=true`);
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiResponse>;
    console.error(axiosError.response?.data.message || axiosError.message);
    return null;
  }
}
