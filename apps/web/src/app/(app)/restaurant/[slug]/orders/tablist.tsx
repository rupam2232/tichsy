"use client";

import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { ScrollArea, ScrollBar } from "@repo/ui/components/scroll-area";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

const ORDER_TABS = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "inProgress", label: "In Progress" },
  { value: "ready", label: "Ready" },
  { value: "unPaid", label: "Unpaid" },
  { value: "completed", label: "Completed" },
];

export default function OrderTabList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentTab = searchParams.get("tab") || "all";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    params.delete("search");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Tabs
      value={currentTab}
      onValueChange={handleTabChange}
      className="w-full sm:w-0 flex-1"
    >
      <ScrollArea className="w-full sm:min-w-0 flex-1 sm:pb-2 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-md">
        <TabsList>
          {ORDER_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="font-medium data-[state=active]:font-semibold data-[state=active]:bg-primary! data-[state=active]:text-primary-foreground! data-[state=active]:border-primary transition-all duration-200 shadow-none"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <ScrollBar orientation="horizontal" className="h-0 sm:h-2" />
      </ScrollArea>
    </Tabs>
  );
}