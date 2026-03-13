import type { Metadata } from "next";
import ProfileTab from "@/components/settings/ProfileTab";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Profile | Settings - Tichsy`,
    description: "Update your personal information and profile picture.",
  };
}

export default function ProfilePage() {
  return <ProfileTab />;
}
