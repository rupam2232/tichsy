"use client";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import StaffOrderDialog from "@/components/features/orders/staff-order-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/tabs";
import { OperationsTab } from "./operations-tab";
import { AnalyticsTab } from "./analytics-tab";

const ClientPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [activeTab, setActiveTab] = useState<string>("operations");
  const role = useSelector((state: RootState) => state.auth.user?.role);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            {role === "owner"
              ? "Monitor live operations and analyze performance"
              : "Monitor live restaurant operations"}
          </p>
        </div>
        <StaffOrderDialog />
      </div>

      <Tabs
        defaultValue="operations"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-2"
      >
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger
            value="operations"
            className="font-medium data-[state=active]:font-semibold data-[state=active]:bg-primary! data-[state=active]:text-primary-foreground! transition-all duration-200"
          >
            Operations
          </TabsTrigger>
          {role === "owner" && (
            <TabsTrigger
              value="analytics"
              className="font-medium data-[state=active]:font-semibold data-[state=active]:bg-primary! data-[state=active]:text-primary-foreground! transition-all duration-200"
            >
              Analytics
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="operations" className="space-y-4">
          <OperationsTab slug={slug} />
        </TabsContent>

        {role === "owner" && (
          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsTab slug={slug} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default ClientPage;
