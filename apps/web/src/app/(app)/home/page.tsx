import type { Metadata } from "next";
import ClientPage from "./clientPage";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Home - ${process.env.NEXT_PUBLIC_APP_NAME}`,
    description: `Home page of ${process.env.NEXT_PUBLIC_APP_NAME}. Create or Manage your restaurant.`,
  };
}

export default function page() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      }
    >
      <ClientPage />
    </Suspense>
  );
}
