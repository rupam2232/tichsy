import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "@/utils/axiosInstance";
import { CurrentSubscription, ApiResponse } from "@repo/types";
import { AxiosError } from "axios";

export interface SubscriptionState {
  currentSubscription: CurrentSubscription | null;
  loading: boolean;
  error: string | null;
}

const initialState: SubscriptionState = {
  currentSubscription: null,
  loading: false,
  error: null,
};

export const fetchSubscriptionDetails = createAsyncThunk(
  "subscription/fetchDetails",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/subscription");
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      // If 404, it means no subscription, so we return null (not an error state)
      if (axiosError.response?.status === 404) {
        return null;
      }
      return rejectWithValue(
        axiosError.response?.data.message ||
          "Failed to fetch subscription details",
      );
    }
  },
);

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    setSubscription(state, action: PayloadAction<CurrentSubscription | null>) {
      state.currentSubscription = action.payload;
    },
    clearSubscription(state) {
      state.currentSubscription = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubscriptionDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchSubscriptionDetails.fulfilled,
        (state, action: PayloadAction<CurrentSubscription | null>) => {
          state.loading = false;
          state.currentSubscription = action.payload;
        },
      )
      .addCase(fetchSubscriptionDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSubscription, clearSubscription } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
