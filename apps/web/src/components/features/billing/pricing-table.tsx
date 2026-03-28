"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";

export interface PlanProps {
  id: string;
  title: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  isFeatured?: boolean;
  isCustom?: boolean;
  buttonText: string;
}

export interface PricingTableSixProps {
  plans: PlanProps[];
  onPlanSelect?: (planId: string) => void;
}

const gradientFrom = ["from-chart-2/70", "from-chart-1/70", "from-chart-3/70"];

const getDiscountPercent = (plan: PlanProps) => {
  return Math.min(
    100,
    Math.max(
      0,
      Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100),
    ),
  );
};

export function PricingTable({ plans, onPlanSelect }: PricingTableSixProps) {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8 pt-36">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-16 grid items-start gap-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-foreground text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-[3.5rem]">
              Tailored plans for{" "}
              <span className="font-light italic">every stage</span>
            </h2>
          </div>

          <div className="lg:pt-4">
            <p className="text-muted-foreground mb-6 text-base leading-relaxed">
              No matter where you are in your journey, find a plan that fits
              your goals and budget.
            </p>

            {/* Toggle with layoutId */}
            <div className="bg-bacground relative inline-flex items-center rounded-full border-t-0 border p-1.5 shadow-[inset_0_1.5px_0_color-mix(in_oklch,_var(--muted-foreground)_20%,_transparent)]">
              <button
                onClick={() => setIsYearly(false)}
                className={`text-foreground relative z-10 cursor-pointer rounded-full px-4 py-2 text-sm font-medium ${
                  !isYearly ? "text-foreground" : "text-muted-foreground"
                }`}
                aria-pressed={!isYearly}
              >
                {!isYearly && (
                  <motion.div
                    layoutId="toggle-indicator"
                    className="bg-secondary absolute inset-0 rounded-full shadow-sm border-muted-foreground/10 border"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">Monthly</span>
              </button>

              <button
                onClick={() => setIsYearly(true)}
                className={`text-foreground relative z-10 cursor-pointer rounded-full px-4 py-2 text-sm font-medium ${
                  isYearly ? "text-foreground" : "text-muted-foreground"
                }`}
                aria-pressed={isYearly}
              >
                {isYearly && (
                  <motion.div
                    layoutId="toggle-indicator"
                    className="bg-secondary absolute inset-0 rounded-full shadow-sm border-muted-foreground/10 border"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">Yearly</span>
                <span className="bg-foreground text-background inline-block rounded-full px-2 py-1 text-xs whitespace-nowrap shadow-sm shadow-foreground/20 relative z-10 ml-2">
                  Save 10%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-6 lg:grid-cols-3 lg:gap-7 max-w-6xl mx-auto justify-center">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`max-w-2xl relative rounded-3xl bg-gradient-to-b p-6 shadow-2xl shadow-foreground/10 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] ${gradientFrom[index]} via-secondary/10 to-background from-[0%] via-[40%] to-[100%]`}
            >
              {/* Most Popular Badge */}
              {plan.isFeatured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                  <div className="bg-background text-foreground ring-muted-foreground/50 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ring-1 shadow-sm shadow-foreground/10">
                    Most popular
                  </div>
                </div>
              )}

              {/* Title and Description */}
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-foreground text-xl font-bold">
                    {plan.title}
                  </h3>
                  {isYearly &&
                    plan.monthlyPrice > 0 &&
                    plan.yearlyPrice < plan.monthlyPrice * 12 && (
                      <motion.div
                        className=""
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <span className="bg-background text-foreground inline-block rounded-full px-2 py-1 text-xs whitespace-nowrap shadow-sm shadow-foreground/30">
                          Save {getDiscountPercent(plan)}%
                        </span>
                      </motion.div>
                    )}
                </div>
                <p className="text-accent-foreground text-sm">
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-8">
                <div className="flex items-baseline">
                  <span className="text-muted-foreground text-base">₹</span>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={isYearly ? "yearly-price" : "monthly-price"}
                      className="text-foreground ml-1 text-5xl font-bold"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </motion.span>
                  </AnimatePresence>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={isYearly ? "per-year" : "per-month"}
                      className="text-muted-foreground ml-2 text-sm flex flex-col"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      INR / {isYearly ? "year" : "month"} {" "}
                      <span className="text-xs">(inclusive of processing fees)</span>
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>

              {/* CTA Button */}
              <div className="mb-8">
                <Button
                  asChild
                  className="bg-foreground text-background hover:bg-foreground/90 border-primary-foreground h-12 w-full sm:w-50 lg:w-full rounded-xl border font-medium transition-all duration-200 hover:cursor-pointer"
                  aria-label={`Start ${plan.title} plan${(isYearly ? plan.yearlyPrice : plan.monthlyPrice) === 0 ? " — free" : ""}`}
                  onClick={() => onPlanSelect?.(plan.id)}
                >
                  <Link href="/billing">{plan.buttonText}</Link>
                </Button>
              </div>

              {/* Features */}
              <div>
                <h4 className="text-muted-foreground mb-4 text-sm font-medium">
                  What&apos;s included:
                </h4>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <div className="bg-accent mt-0.5 mr-3 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full">
                        <Check className="h-2.5 w-2.5" />
                      </div>
                      <span className="text-foreground text-sm leading-relaxed">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
