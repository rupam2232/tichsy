"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Provider as ReduxProvider, useDispatch } from "react-redux";
import { signIn, signOut, UserState } from "@/store/authSlice";
import store from "@/store/store";
import { Toaster } from "@/components/ui/sonner";
import { SocketProvider } from "@/context/SocketContext";
import { fetchSubscriptionDetails } from "@/store/subscriptionSlice";
import type { AppDispatch } from "@/store/store";

function StoreInitializer({ user }: { user?: UserState["user"] }) {
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    if (user) {
      dispatch(signIn(user));
      dispatch(fetchSubscriptionDetails());
    } else {
      dispatch(signOut());
    }
  }, [dispatch, user]);
  return null;
}

export function Providers({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: UserState["user"];
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      enableColorScheme
    >
      <ReduxProvider store={store}>
        <StoreInitializer user={user} />
        <GoogleOAuthProvider
          clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}
        >
          <SocketProvider>{children}</SocketProvider>
          <Toaster richColors expand={true} position="top-right" />
        </GoogleOAuthProvider>
      </ReduxProvider>
    </NextThemesProvider>
  );
}
