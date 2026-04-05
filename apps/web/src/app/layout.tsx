import type { Metadata, Viewport } from "next";
import "@repo/ui/styles/globals.css";
import { Providers } from "./providers";
import serverAxios from "@/utils/server-axios";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  title: "Tichsy - QR Menu Ordering & POS for Restaurants",
  description:
    "Tichsy helps restaurants take orders using table QR codes. Customers scan, browse the menu, and place orders instantly while staff receive orders in real time.",
  keywords: [
  "restaurant pos system",
  "restaurant pos software",
  "qr menu for restaurant",
  "qr code menu for restaurant",
  "qr code ordering system",
  "qr ordering system for restaurants",
  "restaurant qr ordering system",
  "table qr code ordering",
  "restaurant ordering system",
  "digital menu for restaurant",
  "digital menu ordering system",
  "contactless ordering system",
  "contactless restaurant ordering",
  "restaurant table ordering system",
  "restaurant table management system",
  "restaurant order management system",
  "restaurant order tracking system",
  "restaurant menu management software",
  "restaurant staff management software",
  "restaurant analytics dashboard",
  "restaurant management software",
  "restaurant pos india",
  "pos for cafes",
  "cafe pos system",
  "free pos system for cafe india",
  "restaurant billing software india",
  "restaurant qr menu system",
  "restaurant qr code ordering india",
  "restaurant online ordering system",
  "restaurant order dashboard",
  "restaurant operations management",
  "restaurant digital ordering system",
  "tichsy",
  "tichsy pos",
  "tichsy restaurant pos"
],
  authors: [{ name: "Rupam Mondal" }],
  creator: "Rupam Mondal",
  alternates: {
    canonical: "/",
  },
  formatDetection: {
    telephone: false,
    date: false,
    email: false,
    address: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tichsy",
  },
  openGraph: {  
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "Tichsy – QR Menu Ordering & POS for Restaurants",
    description:
      "Tichsy helps restaurants take orders using table QR codes. Customers scan, browse the menu, and place orders instantly while staff receive orders in real time.",
    siteName: "Tichsy",
    images: [
      {
        url: "/og-image-01.png",
        width: 1200,
        height: 630,
        alt: "Tichsy Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tichsy – QR Menu Ordering & POS for Restaurants",
    description:
      "Tichsy helps restaurants take orders using table QR codes. Customers scan, browse the menu, and place orders instantly while staff receive orders in real time.",
    images: ["/og-image-01.png"],
    creator: "@rupam2232",
  },
  icons: {
    icon: [
      {
        url: "/light-icon.svg",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/dark-icon.svg",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: {
      url: "/apple-touch-icon.png",
      sizes: "180x180",
      type: "image/png",
    },
  },
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
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user = null;
  try {
    const response = await serverAxios.get("/user/me");
    if (response.data.success) {
      user = response.data.data;
    }
  } catch {
    // User not authenticated or error, continue as guest
  }

  return (
    <html lang="en" className="custom-scrollbar" suppressHydrationWarning>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Tichsy",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "INR",
              },
              description:
                "Tichsy is a QR code ordering system and POS platform for restaurants. Customers scan table QR codes, browse the menu and place orders instantly.",
            }),
          }}
        />
        <Providers user={user}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
