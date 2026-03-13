import type { Metadata } from "next";
import ClientPage from "./clientPage";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Checkout - Tichsy`,
    description: `Checkout for your subscription.`,
  };
}

export default function page() {
  return <ClientPage />;
}
