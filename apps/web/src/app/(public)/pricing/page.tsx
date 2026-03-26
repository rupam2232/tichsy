import { PricingTable } from "@/components/features/billing/pricing-table";
import type { Metadata } from "next";
import { getAllPlans } from "@repo/pricing";

export const metadata: Metadata = {
  title: "Pricing - Tichsy",
  description: "Explore Tichsy pricing information. Find our affordable pricing plans, with no hidden pricing. We have generous free plan for those getting started.",
  alternates: {
    canonical: "/pricing",
  },
};

export default function PricingPage() {
  const plans = getAllPlans();

  // Transform to match PricingTable's expected format
  const formattedPlans = plans.map((plan) => ({
    id: plan.id,
    title: plan.title,
    description: plan.description,
    monthlyPrice: plan.monthlyPrice === "Free forever" ? 0 : parseInt(plan.monthlyPrice),
    yearlyPrice: plan.yearlyPrice === "Free forever" ? 0 : parseInt(plan.yearlyPrice),
    isFeatured: plan.highlight,
    features: plan.features.map((f) => f.name),
    buttonText: plan.buttonText,
  }));

  return <PricingTable plans={formattedPlans} />;
}
