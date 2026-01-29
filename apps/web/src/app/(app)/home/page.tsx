import type { Metadata } from "next";
import ClientPage from "./clientPage";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Home - ${process.env.NEXT_PUBLIC_APP_NAME}`,
    description: `Home page of ${process.env.NEXT_PUBLIC_APP_NAME}. Create or Manage your restaurant.`,
  };
}

export default function page() {
  return <ClientPage />;
}
