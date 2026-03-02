"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "usehooks-ts";
import SettingsSidebar from "@/components/settings/SettingsSidebar";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only redirect if we know for sure it's a desktop device with plenty of width
    if (mounted && isLargeScreen) {
      router.replace("/settings/profile");
    }
  }, [mounted, isLargeScreen, router]);

  if (!mounted || isLargeScreen === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  // If it's desktop, it's redirecting so don't render anything
  if (isLargeScreen) {
    return null;
  }

  // If it's mobile or tablet, show the tap list
  return (
    <div className="lg:hidden">
      <SettingsSidebar />
    </div>
  );
}
