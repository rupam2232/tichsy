"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@repo/ui/components/button";

export default function SettingsMobileNav() {
  const pathname = usePathname();

  if (pathname === "/settings") return null;

  return (
    <div className="md:hidden mb-4">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="-ml-2 text-muted-foreground"
      >
        <Link href="/settings">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Settings
        </Link>
      </Button>
    </div>
  );
}
