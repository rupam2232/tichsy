"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Shield, MonitorSmartphone, History } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

const navItems = [
  { name: "Profile", href: "/settings/profile", icon: User },
  { name: "Security", href: "/settings/security", icon: Shield },
  {
    name: "Sessions",
    href: "/settings/sessions",
    icon: MonitorSmartphone,
  },
  {
    name: "Security Events",
    href: "/settings/events",
    icon: History,
  },
];

export default function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-auto w-full bg-transparent p-0 space-y-1 items-start justify-start sticky top-[var(--header-height)]">
      {navItems.map((item, index) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center w-full justify-start px-4 py-3 lg:rounded-md transition-all text-sm font-medium border-b lg:border-none",
              isActive
                ? "bg-muted text-foreground"
                : "hover:bg-muted/50 text-muted-foreground hover:text-foreground",
              index === 0 && "border-t",
            )}
          >
            <Icon className="mr-3 size-4" />
            {item.name}
          </Link>
        );
      })}
    </div>
  );
}
