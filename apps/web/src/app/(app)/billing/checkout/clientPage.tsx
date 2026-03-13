"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { plans } from "@/lib/billingsdk-config";
import axios from "@/utils/axiosInstance";
import { toast } from "sonner";
import {
  Loader2,
  Check,
  Lock,
  ChevronLeft,
  LockKeyhole,
  ChevronRight,
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Separator } from "@repo/ui/components/separator";
import { Badge } from "@repo/ui/components/badge";
import loadRazorpayScript from "@/utils/loadRazorpayScript";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { AxiosError } from "axios";
import type { ApiResponse } from "@repo/types";
import { signOut } from "@/store/authSlice";
import { useIsMobile } from "@/hooks/use-mobile";
import { IconReceipt } from "@tabler/icons-react";

interface PreviewData {
  plan: string;
  period: "monthly" | "yearly";
  currency: string;
  subtotal: number;
  discountAmount: number;
  discountReason: string;
  taxAmount: number;
  totalAmount: number;
  action: "create" | "upgrade";
}

export default function ClientPage() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan");
  const period = searchParams.get("period") as "monthly" | "yearly";
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  const selectedPlan = plans.find((p) => p.id === planId);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!planId || !period || !selectedPlan) {
      toast.error("Invalid checkout parameters");
      router.push("/billing");
      return;
    }

    const fetchPreview = async () => {
      try {
        setLoading(true);
        const response = await axios.post("/subscription/preview", {
          plan: planId,
          period: period,
        });
        setPreviewData(response.data.data);
      } catch (error) {
        console.error("Failed to fetch preview:", error);
        const axiosError = error as AxiosError<ApiResponse>;
        if (axiosError.response?.status === 401) {
          dispatch(signOut());
          router.push("/signin?redirect=/billing/checkout");
          return;
        }
        toast.error(
          axiosError.response?.data.message ||
            "Failed to calculate pricing. Please try again.",
        );
        router.push("/billing");
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [planId, period, router, selectedPlan, dispatch]);

  const verifyPayment = async (response: unknown, orderId: string) => {
    if (
      !response ||
      typeof response !== "object" ||
      !("razorpay_payment_id" in response) ||
      !("razorpay_signature" in response)
    ) {
      toast.error("Invalid response from Razorpay");
      return;
    }
    try {
      const verifyResponse = await axios.post("/payment/razorpay/verify", {
        paymentId: response.razorpay_payment_id,
        orderId,
        signature: response.razorpay_signature,
      });
      if (verifyResponse.data.success) {
        toast.success(verifyResponse.data.message || "Payment Successful");
        router.replace("/billing");
        router.refresh();
      } else {
        toast.error(
          verifyResponse.data.message || "Payment Verification Failed",
        );
      }
    } catch (error) {
      console.error("Payment verification failed:", error);
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Payment verification failed. Please try again later.",
      );
    }
  };

  const handlePayment = async () => {
    if (!user || !previewData) return;

    try {
      const res = await loadRazorpayScript();
      if (!res) {
        toast.error("Razorpay SDK failed to load");
        return;
      }
      setProcessing(true);
      const response = await axios.post("/subscription/create", {
        plan: planId,
        period: period,
      });

      if (!response.data.data || !response.data.data.id) {
        toast.error("Invalid response from server");
        return;
      }

      const data = response.data.data;
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: `Tichsy ${selectedPlan?.title}`,
        description: selectedPlan?.description,
        image: process.env.NEXT_PUBLIC_APP_URL + "/favicon.ico",
        order_id: data.id,
        handler: (response: unknown) => verifyPayment(response, data.id),
        notes: {
          ...data.notes,
        },
        theme: {
          color: "#72e3ad",
          backdrop_color: "rgba(0, 0, 0, 0.5)",
        },
        prefill: {
          email: user.email || "",
          contact: "+919977665544",
          name: user.firstName + " " + user.lastName || "",
        },
        readonly: { email: true },
        hidden: { contact: true },
        modal: {
          backdropclose: true,
          confirm_close: true,
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      rzp.on("payment.failed", function () {
        toast.error("Payment Failed");
      });
    } catch (error) {
      console.error("Subscription failed:", error);
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Failed to initiate payment. Please try again.",
      );
    } finally {
      setProcessing(false);
    }
  };

  if (!selectedPlan) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60svh]">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <section className="container max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-6 flex md:flex-col gap-2 items-center md:items-start">
        <Button variant="ghost" onClick={() => router.back()}>
          <ChevronLeft />
          {isMobile ? "" : "Back to Plans"}
        </Button>
        <div>
          <h1 className="md:text-3xl font-bold tracking-tight">
            Review your subscription
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Plan Details */}
        <div className="md:col-span-7 lg:col-span-8 space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    {selectedPlan.title} Plan
                    <Badge
                      variant={period === "yearly" ? "default" : "secondary"}
                    >
                      {period === "yearly" ? "Yearly" : "Monthly"}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-1 text-base">
                    {selectedPlan.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent>
              <h3 className="font-medium mb-4">Included Features:</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedPlan.features.map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <div className="mt-0.5 rounded-full bg-primary/10 p-1">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    {feature.name}
                  </li>
                ))}
              </ul>
            </CardContent>
            <Separator />
            <CardFooter>
              <Button
                variant="link"
                className="px-0 text-muted-foreground"
                onClick={() => router.back()}
              >
                Change Plan
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column: Order Summary */}
        <div className="md:col-span-5 lg:col-span-4">
          <div className="sticky top-6">
            <Card className="shadow-sm border-border pb-0">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <IconReceipt className="size-4" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{previewData?.subtotal.toFixed(2)}</span>
                  </div>
                  {previewData && previewData.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>
                        Discount
                        <span className="text-xs block text-muted-foreground/80">
                          ({previewData.discountReason})
                        </span>
                      </span>
                      <span>-₹{previewData.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground mr-2">
                      Payment Processing Fee (2.5%)
                    </span>
                    <span>₹{previewData?.taxAmount.toFixed(2)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between items-end">
                  <span className="font-semibold">Total Payable</span>
                  <span className="text-2xl font-bold">
                    ₹{previewData?.totalAmount.toFixed(2)}
                  </span>
                </div>

                <Button
                  className="w-full font-bold shadow-lg shadow-primary/20 group"
                  size="lg"
                  onClick={handlePayment}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <LockKeyhole />
                      Pay Now
                      <ChevronRight className="group-hover:translate-x-0.5 transition-all" />
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-4 pt-2 grayscale opacity-70">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Secure payment via Razorpay
                  </span>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 py-3 pb-4 text-xs text-muted-foreground text-center justify-center border-t">
                By clicking &#34;Pay Now&#34;, you agree to our Terms of Service
                and Privacy Policy
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
