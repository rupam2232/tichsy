import type { Metadata } from "next";
import SettingsSidebar from "@/components/settings/SettingsSidebar";
import SettingsMobileNav from "@/components/settings/SettingsMobileNav";

export const metadata: Metadata = {
  title: `Settings - ${process.env.NEXT_PUBLIC_APP_NAME}`,
  description:
    "Manage your profile, security preferences, and active sessions.",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto px-4 @container/main">
      <div className="py-3">
        <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your profile, security preferences, and active sessions.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-10 pt-3 pb-5">
        <div className="hidden @3xl/main:block w-64 shrink-0">
          <SettingsSidebar />
        </div>

        <div className="flex-1 w-full">
          <SettingsMobileNav />
          {children}
        </div>
      </div>
    </section>
  );
}
