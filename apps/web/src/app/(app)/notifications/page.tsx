import type { Metadata } from "next";
import ClientPage from "./clientPage";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Notifications - Tichsy",
  description:
    "Notification page of Tichsy. View and Manage your notifications.",
};

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
