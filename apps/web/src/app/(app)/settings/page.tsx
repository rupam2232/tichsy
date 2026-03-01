"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import SettingsSidebar from "@/components/settings/SettingsSidebar";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only redirect if we know for sure it's a desktop device
    if (mounted && isMobile === false) {
      router.replace("/settings/profile");
    }
  }, [mounted, isMobile, router]);

  if (!mounted || isMobile === undefined || isMobile === false) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  // If it's mobile, show the tap list
  return (
    <div className="md:hidden">
      <SettingsSidebar />
    </div>
  );
}
