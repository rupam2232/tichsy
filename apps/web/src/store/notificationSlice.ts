import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "@/utils/axiosInstance";
import { Notification, ApiResponse } from "@repo/types";
import { AxiosError } from "axios";

export interface NotificationState {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
}

const initialState: NotificationState = {
  notifications: [],
  total: 0,
  unreadCount: 0,
  loading: false,
  error: null,
  page: 1,
  totalPages: 1,
};

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async (
    { page = 1, limit = 10 }: { page?: number; limit?: number },
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.get(
        `/notification?page=${page}&limit=${limit}`,
      );
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      return rejectWithValue(
        axiosError.response?.data?.message || "Failed to fetch notifications",
      );
    }
  },
);

export const markNotificationAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/notification/${id}/read`);
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      return rejectWithValue(
        axiosError.response?.data?.message ||
          "Failed to mark notification as read",
      );
    }
  },
);

export const markAllNotificationsAsRead = createAsyncThunk(
  "notifications/markAllAsRead",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.patch("/notification/read-all");
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      return rejectWithValue(
        axiosError.response?.data?.message ||
          "Failed to mark all notifications as read",
      );
    }
  },
);

export const markNotificationAsReadByMergeKey = createAsyncThunk(
  "notifications/markAsReadByMergeKey",
  async (mergeKey: string, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `/notification/merge-key/${mergeKey}/read`,
      );
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      return rejectWithValue(
        axiosError.response?.data?.message ||
          "Failed to mark notifications as read",
      );
    }
  },
);

export const deleteNotification = createAsyncThunk(
  "notifications/deleteNotification",
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/notification/${id}`);
      return id;
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      return rejectWithValue(
        axiosError.response?.data?.message || "Failed to delete notification",
      );
    }
  },
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      // Check if we need to merge (if logic wasn't fully handled by backend or for optimistic UI)

      const existingIndex = state.notifications.findIndex(
        (n) => n._id === action.payload._id,
      );

      if (existingIndex !== -1) {
        // Update existing
        state.notifications[existingIndex] = action.payload;
      } else {
        // Add new to top
        state.notifications.unshift(action.payload);
        state.unreadCount += 1;
        state.total += 1;
      }
    },
    resetNotifications: (state) => {
      state.notifications = [];
      state.total = 0;
      state.unreadCount = 0;
      state.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        if (action.meta.arg.page === 1) {
          state.notifications = action.payload.notifications;
        } else {
          // Filter duplicates
          const newNotifs = action.payload.notifications.filter(
            (n: Notification) =>
              !state.notifications.some((existing) => existing._id === n._id),
          );
          state.notifications = [...state.notifications, ...newNotifs];
        }

        state.total = action.payload.total;
        state.unreadCount = action.payload.unreadCount;
        state.totalPages = action.payload.totalPages;
        state.page = action.payload.currentPage;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const updatedNotification = action.payload;
        if (updatedNotification) {
          const index = state.notifications.findIndex(
            (n) => n._id === updatedNotification._id,
          );
          if (index !== -1) {
            const notification = state.notifications[index];
            if (notification) {
              if (!notification.read) {
                state.unreadCount = Math.max(0, state.unreadCount - 1);
              }
              state.notifications[index] = updatedNotification;
            }
          }
        }
      })
      .addCase(markNotificationAsReadByMergeKey.fulfilled, (state, action) => {
        const updatedData = action.payload;
        // Check if payload is an array or single object
        const notificationsToUpdate = Array.isArray(updatedData)
          ? updatedData
          : [updatedData];

        notificationsToUpdate.forEach((updatedNotification: Notification) => {
          if (updatedNotification) {
            const index = state.notifications.findIndex(
              (n) => n._id === updatedNotification._id,
            );
            if (index !== -1) {
              const notification = state.notifications[index];
              if (notification) {
                if (!notification.read) {
                  state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
                state.notifications[index] = updatedNotification;
              }
            }
          }
        });
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => (n.read = true));
        state.unreadCount = 0;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const id = action.payload;
        const index = state.notifications.findIndex((n) => n._id === id);
        if (index !== -1) {
          const notification = state.notifications[index];
          if (!notification?.read) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          state.notifications.splice(index, 1);
          state.total = Math.max(0, state.total - 1);
        }
      });
  },
});

export const { addNotification, resetNotifications } =
  notificationSlice.actions;
export default notificationSlice.reducer;
