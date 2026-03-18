export interface Plan {
  id: string;
  title: string;
  description: string;
  highlight?: boolean;
  type?: "monthly" | "yearly";
  currency?: string;
  monthlyPrice: string;
  yearlyPrice: string;
  buttonText: string;
  badge?: string;
  features: {
    name: string;
    icon: string;
    iconColor?: string;
  }[];
}

export interface CurrentPlan {
  plan: Plan;
  type: "monthly" | "yearly" | "custom";
  price?: string;
  startDate?: string;
  endDate?: string;
  status: "active" | "inactive" | "past_due" | "cancelled";
}

// Plan hierarchy for determining upgrade/downgrade
export const PlanHierarchy: Record<string, number> = {
  starter: 1,
  medium: 2,
  pro: 3,
};

export const plans: Plan[] = [
  {
    id: "starter",
    title: "Starter",
    description: "Perfect for new ventures & cozy cafes",
    currency: "₹",
    monthlyPrice: "Free forever",
    yearlyPrice: "Free forever",
    buttonText: "Start today for free",
    features: [
      {
        name: "Manage 1 restaurant",
        icon: "check",
        iconColor: "text-green-500",
      },
      {
        name: "Up to 10 tables per restaurant",
        icon: "check",
        iconColor: "text-orange-500",
      },
      {
        name: "50 menu items & 5 categories",
        icon: "check",
        iconColor: "text-teal-500",
      },
      {
        name: "2 staff accounts included",
        icon: "check",
        iconColor: "text-blue-500",
      },
      {
        name: "30-day order history retention",
        icon: "check",
        iconColor: "text-zinc-500",
      },
    ],
  },
  {
    id: "medium",
    title: "Medium",
    description: "Scale your growing restaurant business",
    currency: "₹",
    monthlyPrice: "499",
    yearlyPrice: "4999",
    buttonText: "Sign up",
    badge: "Most popular",
    highlight: true,
    features: [
      {
        name: "Manage up to 3 restaurants",
        icon: "check",
        iconColor: "text-green-500",
      },
      {
        name: "50 tables per restaurant",
        icon: "check",
        iconColor: "text-orange-500",
      },
      {
        name: "200 menu items & 15 categories per restaurant",
        icon: "check",
        iconColor: "text-teal-500",
      },
      {
        name: "10 staff accounts per restaurant",
        icon: "check",
        iconColor: "text-blue-500",
      },
      {
        name: "90-day order history & 15 coupons",
        icon: "check",
        iconColor: "text-zinc-500",
      },
    ],
  },
  {
    id: "pro",
    title: "Pro",
    description: "Ultimate power for restaurant chains",
    currency: "₹",
    monthlyPrice: "799",
    yearlyPrice: "7999",
    buttonText: "Sign up",
    highlight: true,
    features: [
      {
        name: "Manage up to 10 restaurants",
        icon: "check",
        iconColor: "text-green-500",
      },
      {
        name: "Unlimited tables, items & staff per restaurant",
        icon: "check",
        iconColor: "text-orange-500",
      },
      {
        name: "5GB storage for high-res images",
        icon: "check",
        iconColor: "text-teal-500",
      },
      {
        name: "Unlimited order history",
        icon: "check",
        iconColor: "text-blue-500",
      },
      {
        name: "Priority support & unlimited coupons",
        icon: "check",
        iconColor: "text-zinc-500",
      },
    ],
  },
];
