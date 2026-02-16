import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { SidebarInset, SidebarProvider } from "@repo/ui/components/sidebar";
import { ScrollArea, ScrollBar } from "@repo/ui/components/scroll-area";
import { SubscriptionSuccessListener } from "@/components/features/billing/subscription-success-listener";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider
      style={
        {
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <ScrollArea className="h-screen md:h-[96vh] w-full">
          <>
            <SiteHeader />
            {children}
            <SubscriptionSuccessListener />
          </>
          <ScrollBar
            orientation="vertical"
            className="z-12"
            thumbClassName="bg-zinc-300 dark:bg-zinc-600"
          />
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  );
}
