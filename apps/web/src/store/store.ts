"use client";
import { configureStore } from "@reduxjs/toolkit";
import authReducer, { UserState } from "./authSlice";
import restaurantsReducer, { RestaurantsState } from "./restaurantSlice";
import cartReducer, { CartItem } from "./cartSlice";
import orderHistoryReducer, { OrderHistoryItem } from "./orderHistorySlice";
import subscriptionReducer, { SubscriptionState } from "./subscriptionSlice";
import notificationReducer, { NotificationState } from "./notificationSlice";

type State = {
  auth: {
    status: UserState["status"];
    user: UserState["user"];
  };
  restaurantsSlice: RestaurantsState;
  cart: CartItem[];
  orderHistory: OrderHistoryItem[];
  subscription: SubscriptionState;
  notifications: NotificationState;
};

const preloadedState: State = (() => {
  try {
    const stored = localStorage.getItem("userState");
    return stored
      ? JSON.parse(stored)
      : {
          auth: {
            status: false,
            user: null,
          },
          restaurantsSlice: {
            restaurants: [],
            activeRestaurant: null,
          },
          cart: [],
          orderHistory: [],
          subscription: {
            currentSubscription: null,
            loading: false,
            error: null,
          },
          notifications: {
            notifications: [],
            total: 0,
            unreadCount: 0,
            loading: false,
            error: null,
            page: 1,
            totalPages: 1,
          },
        };
  } catch {
    return {
      auth: {
        status: false,
        user: null,
      },
      restaurantsSlice: {
        restaurants: [],
        activeRestaurant: null,
      },
      cart: [],
      orderHistory: [],
      subscription: {
        currentSubscription: null,
        loading: false,
        error: null,
      },
      notifications: {
        notifications: [],
        total: 0,
        unreadCount: 0,
        loading: false,
        error: null,
        page: 1,
        totalPages: 1,
      },
    };
  }
})();

const store = configureStore({
  reducer: {
    auth: authReducer,
    restaurantsSlice: restaurantsReducer,
    cart: cartReducer,
    orderHistory: orderHistoryReducer,
    subscription: subscriptionReducer,
    notifications: notificationReducer,
  },
  preloadedState,
});

store.subscribe(() => {
  localStorage.setItem("userState", JSON.stringify(store.getState()));
});

// Infer the type of store
export type AppStore = typeof store;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
