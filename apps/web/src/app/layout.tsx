import type { Metadata } from "next";
import "@repo/ui/styles/globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: `${process.env.NEXT_PUBLIC_APP_NAME} - Modern POS for Restaurants`,
  description:
    "The best point of sale system for restaurants, cafes, and retail businesses.",
};

export default async function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  let user = null;
  try {
    const { default: serverAxios } = await import("@/utils/server-axios");
    const response = await serverAxios.get("/user/me");
    if (response.data.success) {
      user = response.data.data;
    }
  } catch {
    // User not authenticated or error, continue as guest
  }

  return (
    <html lang="en">
      <body>
        <Providers user={user}>
          {modal}
          {children}
        </Providers>
      </body>
    </html>
  );
}
