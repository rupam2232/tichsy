"use client";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { AnalyticsContent } from "./analytics-content";

const ClientPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const role = useSelector((state: RootState) => state.auth.user?.role);

  if (role !== "owner") {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <p className="text-muted-foreground text-center">
          You do not have permission to view analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Deep dive into your restaurant&apos;s historical performance.
          </p>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <AnalyticsContent slug={slug} />
      </div>
    </div>
  );
};

export default ClientPage;
