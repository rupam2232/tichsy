import type { Metadata } from "next";
import SecurityEventsTab from "@/components/settings/SecurityEventsTab";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Security Events | Settings - ${process.env.NEXT_PUBLIC_APP_NAME}`,
    description:
      "Review your account security activity scale and login history.",
  };
}

export default function EventsPage() {
  return <SecurityEventsTab />;
}
