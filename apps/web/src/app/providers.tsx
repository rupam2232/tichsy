"use client";

import { useCallback, useEffect } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Provider as ReduxProvider, useDispatch } from "react-redux";
import { signIn, signOut } from "@/store/authSlice";
import store from "@/store/store";
import { Toaster } from "@repo/ui/components/sonner";
import axios from "@/utils/axiosInstance";

function FetchCurrentUser({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  
  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await axios.get("/user/me");
      if (response.data.success) {
        dispatch(signIn(response.data.data));
      } else {
        dispatch(signOut());
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      dispatch(signOut());
    }
  }, [dispatch]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      enableColorScheme
    >
      <ReduxProvider store={store}>
        <GoogleOAuthProvider
          clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}
        >
          <FetchCurrentUser>{children}</FetchCurrentUser>
          <Toaster richColors expand={true} position="top-right" />
        </GoogleOAuthProvider>
      </ReduxProvider>
    </NextThemesProvider>
  );
}
