import type { Metadata } from "next";
import SecurityEventsTab from "@/components/settings/SecurityEventsTab";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Events | Settings - Tichsy`,
    description:
      "Review your account activity and login history.",
  };
}

export default function EventsPage() {
  return <SecurityEventsTab />;
}
