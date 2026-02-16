"use client";

import { useEffect, useState } from "react";
import axios from "@/utils/axiosInstance";
import {
  InvoiceHistory,
  type InvoiceItem,
} from "./invoice-history";
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
            id: item.transactionId || item._id,
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
            invoiceUrl: "#", // Placeholder until we have invoice generation
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
      />
    </div>
  );
}
