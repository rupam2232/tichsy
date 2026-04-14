"use client";

import { BarChart3, LayoutGrid, Power, Users, Zap, Download } from "lucide-react";
import { IconQrcode, IconRadar, IconToolsKitchen } from "@tabler/icons-react";
import BorderGlow from "@/components/ui/border-glow";
import { FadeUp } from "@/components/shared/fade-up";

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export default function Features() {
  const features = [
    {
      title: "QR Code Ordering",
      description:
        "Customers scan the table QR code, browse your menu, and place orders instantly without waiting.",
      icon: <IconQrcode />,
    },
    {
      title: "Real-Time Orders",
      description:
        "Orders appear instantly on your dashboard so your staff can prepare and serve without delays.",
      icon: <Zap />,
    },
    {
      title: "Menu Management",
      description:
        "Add items, update prices, upload images, and control availability anytime.",
      icon: <IconToolsKitchen />,
    },
    {
      title: "Table Management",
      description:
        "Create tables, assign QR codes, and track table status in real time.",
      icon: <LayoutGrid />,
    },
    {
      title: "Staff Access & Roles",
      description:
        "Invite staff and let them manage orders, update status, and handle daily operations.",
      icon: <Users />,
    },
    {
      title: "Live Order Tracking",
      description:
        "Customers can track their order status without asking staff.",
      icon: <IconRadar />,
    },
    {
      title: "Restaurant Control",
      description:
        "Turn your restaurant on or off anytime to control when customers can view and place orders.",
      icon: <Power />,
    },
    {
      title: "Simple Analytics",
      description:
        "Track orders, revenue, popular items and more to understand your business better.",
      icon: <BarChart3 />,
    },
    {
      title: "Export Data",
      description:
        "Easily download your revenue and sales data to share with accountants or use in spreadsheets.",
      icon: <Download />,
    },
  ];
  return (
    <section
      id="features"
      className="relative z-20 container mx-auto px-4 pt-30"
    >
      <FadeUp delay={0.2} duration={0.8} yOffset={40}>
        <div className="text-center mb-20">
          <h1 className="text-3xl md:text-4xl lg:text-5xl tracking-tighter font-geist bg-clip-text text-transparent mx-auto bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.55)_100%)] dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] lg:leading-tight max-w-4xl pb-4">
            Everything Your Restaurant Needs
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto font-normal">
            From QR-based ordering to real-time order tracking, Tichsy gives you
            everything you need to manage tables, orders, and staff without the
            chaos.
          </p>
        </div>
      </FadeUp>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 rounded-md max-w-6xl mx-auto">
        {features.map((feature, index) => (
          <div 
            key={feature.title}
            className={index === features.length - 1 ? "sm:col-span-2 md:col-span-1" : ""}
          >
            <FeatureCard
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

const FeatureCard = ({ title, description, icon }: FeatureCardProps) => (
  <FadeUp delay={0.2} duration={0.8} yOffset={40} className="h-full">
    <BorderGlow
      edgeSensitivity={30}
      darkGlowColor="155 80 50"
      lightGlowColor="155 80 50"
      darkBackgroundColor="#060010"
      lightBackgroundColor="#ffffff"
      borderRadius={28}
      glowRadius={40}
      glowIntensity={1}
      coneSpread={25}
      animated={false}
      darkColors={["#34d399", "#10b981", "#059669"]}
      lightColors={["#34d399", "#10b981", "#059669"]}
      className="h-full"
    >
      <div className="p-6 flex flex-col gap-y-5">
        <div className="flex items-center gap-2 [&>svg]:size-4">{icon}</div>
        <h3 className="text-xl md:text-2xl tracking-tighter font-medium lg:leading-tight bg-clip-text text-transparent bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.55)_100%)] dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)]">
          {title}
        </h3>
        <p className="text-muted-foreground font-normal text-sm">
          {description}
        </p>
      </div>
    </BorderGlow>
  </FadeUp>
);
