"use client";

import {
  PlanProps,
  PricingTable,
} from "../billing/pricing-table";
import { useRouter } from "next/navigation";

export default function PricingTable() {
  const router = useRouter();
  const plans: PlanProps[] = [
    {
      id: "starter",
      title: "Starter",
      description: "Perfect for new ventures & cozy cafes",
      monthlyPrice: 299,
      yearlyPrice: 2999,
      features: [
        "Manage 1 restaurant",
        "Up to 10 tables per restaurant",
        "50 menu items & 5 categories",
        "2 staff accounts included",
        "30-day order history retention",
      ],
    },
    {
      id: "medium",
      title: "Medium",
      description: "Scale your growing restaurant business",
      monthlyPrice: 499,
      yearlyPrice: 4999,
      isFeatured: true,
      features: [
        "Manage up to 3 restaurants",
        "50 tables per restaurant",
        "200 menu items & 15 categories per restaurant",
        "10 staff accounts per restaurant",
        "90-day order history & 15 coupons",
      ],
    },
    {
      id: "pro",
      title: "Pro",
      description: "Ultimate power for restaurant chains",
      monthlyPrice: 799,
      yearlyPrice: 7999,
      isCustom: false,
      features: [
        "Manage up to 10 restaurants",
        "Unlimited tables, items & staff per restaurant",
        "5GB storage for high-res images",
        "Unlimited order history",
        "Priority support & unlimited coupons",
      ],
    },
  ];

  return (
    <PricingTable
      plans={plans}
      onPlanSelect={() => router.push("/billing")}
    />
  );
}
