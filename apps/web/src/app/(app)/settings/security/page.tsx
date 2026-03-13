import type { Metadata } from "next";
import SecurityTab from "@/components/settings/SecurityTab";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Security | Settings - Tichsy`,
    description: "Manage your email and update your password.",
  };
}

export default function SecurityPage() {
  return <SecurityTab />;
}
