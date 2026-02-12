import type { Metadata } from "next";
import "@repo/ui/styles/globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: `${process.env.NEXT_PUBLIC_APP_NAME} - Modern POS for Restaurants`,
    template: `%s | ${process.env.NEXT_PUBLIC_APP_NAME}`,
  },
  description:
    "The best point of sale system for restaurants, cafes, and retail businesses. Streamline orders, manage tables, and accept payments with QR codes.",
  keywords: [
    "POS",
    "Point of Sale",
    "Restaurant POS",
    "QR Menu",
    "Digital Menu",
    "Contactless Ordering",
    "Restaurant Management",
    "Cafe POS",
  ],
  authors: [{ name: "Your Company Name" }],
  creator: "Your Company Name",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: `${process.env.NEXT_PUBLIC_APP_NAME} - Modern POS for Restaurants`,
    description:
      "Revolutionize your restaurant operations with our all-in-one POS solution. Lightning-fast orders, real-time table management, and seamless QR ordering.",
    siteName: process.env.NEXT_PUBLIC_APP_NAME,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${process.env.NEXT_PUBLIC_APP_NAME} Preview`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${process.env.NEXT_PUBLIC_APP_NAME} - Modern POS for Restaurants`,
    description:
      "Streamline orders, manage tables, and grow your business with our modern POS solution.",
    images: ["/og-image.png"],
    creator: "@yourhandle",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
