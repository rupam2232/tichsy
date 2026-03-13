import type { Metadata } from "next";
import SecurityEventsTab from "@/components/settings/SecurityEventsTab";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Security Events | Settings - Tichsy`,
    description:
      "Review your account security activity scale and login history.",
  };
}

export default function EventsPage() {
  return <SecurityEventsTab />;
}
