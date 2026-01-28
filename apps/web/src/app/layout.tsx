import type { Metadata } from "next";
import "@repo/ui/styles/globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: `${process.env.NEXT_PUBLIC_APP_NAME} - Modern POS for Restaurants`,
  description: "The best point of sale system for restaurants, cafes, and retail businesses.",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {modal}
          {children}
        </Providers>
      </body>
    </html>
  );
}
