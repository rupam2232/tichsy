import type { Metadata } from "next";
import ProfileTab from "@/components/settings/ProfileTab";

export const metadata: Metadata = {
  title: "Profile | Settings - Tichsy",
  description: "Update your personal information and profile picture.",
};

export default function ProfilePage() {
  return <ProfileTab />;
}
