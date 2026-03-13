import type { Metadata } from "next";
import ClientPage from "./clientPage";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Billing - Tichsy`,
    description: `Manage your billing details.`,
  };
}

export default function page() {
  return <ClientPage />;
}
