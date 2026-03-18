import type { Metadata } from "next";
import SecurityTab from "@/components/settings/SecurityTab";

export const metadata: Metadata = {
  title: "Security | Settings - Tichsy",
  description: "Manage your email and password securely.",
};

export default function SecurityPage() {
  return <SecurityTab />;
}
