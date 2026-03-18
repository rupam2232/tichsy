import type { Metadata } from "next";
import SessionsTab from "@/components/settings/SessionsTab";

export const metadata: Metadata = {
  title: "Sessions | Settings - Tichsy",
  description: "Manage your device sessions securely.",
};

export default function SessionsPage() {
  return <SessionsTab />;
}
