import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tichsy – QR Menu Ordering & POS for Restaurants",
    short_name: "Tichsy",
    description:
      "Tichsy helps restaurants take orders using table QR codes. Customers scan, browse the menu, and place orders instantly while staff receive orders in real time.",
    start_url: "/home",
    display: "standalone",
    background_color: "#171717",
    theme_color: "#171717",
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
