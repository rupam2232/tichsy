import type { Metadata } from "next";
import NotificationTab from "@/components/settings/NotificationTab";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Notifications | Settings - Tichsy`,
    description: "Manage your notification preferences.",
  };
}

export default function NotificationPage() {
  return <NotificationTab />;
}
