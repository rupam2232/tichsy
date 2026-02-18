"use client";

import { useEffect, useState } from "react";
import axios from "@/utils/axiosInstance";
import { InvoiceHistory, type InvoiceItem } from "./invoice-history";
import { Loader2 } from "lucide-react";
import { ApiResponse } from "@repo/types";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { signOut } from "@/store/authSlice";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";

interface SubscriptionHistoryItem {
  _id: string;
  createdAt: string;
  amount: number;
  plan: string;
  period: string;
  transactionId: string;
  status?: string;
  paymentGateway?: string;
  totalAmount?: number;
  isTrial?: boolean;
}

export function SubscriptionHistoryList() {
  const [history, setHistory] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get("/subscription/history");
        const data = response.data.data;

        // Map backend data to frontend model
        const formattedHistory: InvoiceItem[] = data.map(
          (item: SubscriptionHistoryItem) => ({
            id: item._id,
            date: item.createdAt
              ? new Date(item.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "-",
            amount: `₹${(item.totalAmount || item.amount).toFixed(2)}`,
            status: item.isTrial ? "trial" : "paid",
            description: item.isTrial
              ? "Trial Plan"
              : item.plan
                ? `${item.plan.charAt(0).toUpperCase() + item.plan.slice(1)} plan - ${item.period ?? "monthly"}`
                : "",
            invoiceUrl: "",
          }),
        );

        setHistory(formattedHistory);
      } catch (error) {
        console.error("Failed to fetch subscription history:", error);
        const axiosError = error as AxiosError<ApiResponse>;
        toast.error(
          axiosError.response?.data.message ||
            "Failed to fetch subscription history",
        );
        if (axiosError.response?.status === 401) {
          dispatch(signOut());
          router.push("/signin?redirect=/billing");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [dispatch, router]);

  const handleDownload = async (invoiceId: string) => {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await axios.get(
        `/subscription/history/${invoiceId}/receipt`,
        {
          params: { timezone: timeZone },
          responseType: "blob",
        },
      );

      // Create a blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Extract filename from content-disposition if possible, or use default
      const contentDisposition = response.headers["content-disposition"];
      let fileName = `receipt-${invoiceId}.pdf`;
      if (contentDisposition) {
        const matches = /filename=([^;]+)/.exec(contentDisposition);
        if (matches && matches[1]) {
          fileName = matches[1].replace(/['"]/g, "");
        }
      }

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();

      // Clean up
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download receipt:", error);
      toast.error("Failed to download receipt. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="mt-20">
        <Card>
          <CardHeader>
            <CardTitle>No Subscription History</CardTitle>
            <CardDescription>
              You don&apos;t have any subscription history yet. Start by
              upgrading to a plan.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-20">
      <InvoiceHistory
        invoices={history}
        title="Subscription History"
        description="View your recent transactions and download invoices."
        onDownload={handleDownload}
      />
    </div>
  );
}
