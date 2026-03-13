import type { Metadata } from "next";
import SessionsTab from "@/components/settings/SessionsTab";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Active Sessions | Settings - Tichsy`,
    description: "Manage devices securely logged into your account.",
  };
}

export default function SessionsPage() {
  return <SessionsTab />;
}
