import type { Metadata } from "next";
import SessionsTab from "@/components/settings/SessionsTab";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Sessions | Settings - Tichsy`,
    description: "Manage your device sessions securely.",
  };
}

export default function SessionsPage() {
  return <SessionsTab />;
}
