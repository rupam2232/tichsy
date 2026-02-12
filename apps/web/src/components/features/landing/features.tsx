"use client";

import { cn } from "@repo/ui/lib/utils";
import { motion } from "framer-motion";
import QrCodeAnimation from "./qr-code-animation";

interface FeatureCardProps {
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
}

export default function Features() {
  const features = [
    {
      title: "QR Code Ordering",
      description:
        "Give your customers the power to see menu and order directly from their table. Seamless, fast, and completely frictionless.",
      skeleton: <SkeletonOne />,
      className:
        "col-span-1 md:col-span-2 lg:row-span-2 border-b md:border-r dark:border-neutral-800 md:flex",
    },
    {
      title: "Live Table Management",
      description:
        "Manage seating, track table status, and mark tables as occupied or available in real-time with our intuitive floor plan view.",
      skeleton: <SkeletonTwo />,
      className: "col-span-1 md:col-span-1 border-b dark:border-neutral-800",
    },
    {
      title: "Real-time Analytics",
      description:
        "Monitor sales, popular items in real-time with intuitive dashboards and reports.",
      skeleton: <SkeletonThree />,
      className:
        "col-span-1 md:col-span-1 border-b md:border-r dark:border-neutral-800 flex flex-col justify-between",
    },
  ];
  return (
    <section
      id="features"
      className="relative z-20 py-10 lg:py-40 max-w-7xl mx-auto"
    >
      <div className="px-8">
        <h4 className="text-3xl lg:text-5xl lg:leading-tight max-w-5xl mx-auto text-center tracking-tight font-medium text-black dark:text-white">
          Everything you need to run your restaurant
        </h4>

        <p className="text-lg lg:text-lg max-w-2xl my-4 mx-auto text-neutral-500 text-center font-normal dark:text-neutral-300">
          Streamline operations, delight customers, and grow your business with
          our all-in-one POS solution.
        </p>
      </div>

      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-rows-2 mt-12 xl:border rounded-md dark:border-neutral-800">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              className={feature.className}
              title={feature.title}
              description={feature.description}
            >
              <div className="w-full">{feature.skeleton}</div>
            </FeatureCard>
          ))}
        </div>
      </div>
    </section>
  );
}

const FeatureCard = ({
  title,
  description,
  className,
  children,
}: FeatureCardProps) => (
  <motion.div
    whileHover="hover"
    initial="initial"
    className={cn("group relative overflow-hidden border p-6", className)}
  >
    <div>
      <FeatureTitle>{title}</FeatureTitle>
      <FeatureDescription>{description}</FeatureDescription>
    </div>
    {children}
  </motion.div>
);

const FeatureTitle = ({ children }: { children?: React.ReactNode }) => {
  return (
    <h3 className="max-w-5xl mx-auto text-left tracking-tight text-black dark:text-white text-xl md:text-2xl md:leading-snug">
      {children}
    </h3>
  );
};

const FeatureDescription = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p
      className={cn(
        "text-sm md:text-base max-w-4xl text-left mx-auto",
        "text-neutral-500 text-center font-normal dark:text-neutral-300",
        "text-left max-w-sm mx-0 md:text-sm my-2",
      )}
    >
      {children}
    </p>
  );
};

export const SkeletonOne = () => {
  return (
    <div className="relative flex px-2 gap-10 h-full">
      <div className="w-full h-full bg-card group">
        <div className="h-full flex flex-1 flex-col justify-center items-center space-y-2">
          <QrCodeAnimation />
        </div>
      </div>

      {/* top and bottom */}
      <div className="absolute bottom-0 z-40 inset-x-0 h-20 bg-gradient-to-t from-background via-white dark:via-background to-transparent w-full pointer-events-none" />
      <div className="absolute top-0 z-40 inset-x-0 h-20 bg-gradient-to-b from-background via-transparent to-transparent w-full pointer-events-none" />
      {/* left and right */}
      <div className="hidden md:block absolute left-0 z-40 inset-y-0 h-full w-20 bg-gradient-to-r from-background via-white dark:via-background to-transparent pointer-events-none" />
      <div className="hidden md:block absolute right-0 z-40 inset-y-0 h-full w-20 bg-gradient-to-l from-background via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

export const SkeletonTwo = () => {
  return (
    <div className="relative flex flex-col items-start py-8 pb-0 gap-10 h-full overflow-hidden">
      <div className="h-32 w-full overflow-hidden rounded-lg border bg-background/50">
        <div className="grid grid-cols-3 gap-1 h-full place-items-center opacity-50">
          <div className="w-8 h-8 rounded bg-green-500/20 border border-green-500/50 text-xs flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary">
            T1
          </div>
          <div className="w-8 h-8 rounded bg-red-500/20 border border-red-500/50 text-xs flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-destructive">
            T2
          </div>
          <div className="w-8 h-8 rounded bg-red-500/20 border border-red-500/50 text-xs flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-destructive">
            T3
          </div>
          <div className="w-8 h-8 rounded bg-green-500/20 border border-green-500/50 text-xs flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary">
            T4
          </div>
          <div className="w-8 h-8 rounded bg-muted border text-xs flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-secondary-foreground/50">
            T5
          </div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonThree = () => {
  return (
    <div className="mt-auto h-32 w-full flex items-end gap-1 px-4 pb-0">
      <motion.div
        variants={{
          initial: { scaleY: 1 },
          hover: {
            scaleY: [1, 1.2, 0.8, 1],
            transition: {
              repeat: Infinity,
              repeatType: "mirror",
              duration: 3,
              ease: "easeInOut",
            },
          },
        }}
        whileHover={{ scaleY: 1 }}
        style={{ originY: 1 }}
        className="w-1/5 h-[40%] bg-primary/40 rounded-t hover:bg-primary/95 transition-colors cursor-pointer"
      />
      <motion.div
        variants={{
          initial: { scaleY: 1 },
          hover: {
            scaleY: [1, 1.3, 0.7, 1],
            transition: {
              repeat: Infinity,
              repeatType: "mirror",
              duration: 3.2,
              ease: "easeInOut",
            },
          },
        }}
        whileHover={{ scaleY: 1 }}
        style={{ originY: 1 }}
        className="w-1/5 h-[60%] bg-primary rounded-t hover:bg-primary/95 transition-colors cursor-pointer"
      />
      <motion.div
        variants={{
          initial: { scaleY: 1 },
          hover: {
            scaleY: [1, 1.4, 0.6, 1],
            transition: {
              repeat: Infinity,
              repeatType: "mirror",
              duration: 3.1,
              ease: "easeInOut",
            },
          },
        }}
        whileHover={{ scaleY: 1 }}
        style={{ originY: 1 }}
        className="w-1/5 h-[30%] bg-primary/60 rounded-t hover:bg-primary/95 transition-colors cursor-pointer"
      />
      <motion.div
        variants={{
          initial: { scaleY: 1 },
          hover: {
            scaleY: [1, 1.1, 0.9, 1],
            transition: {
              repeat: Infinity,
              repeatType: "mirror",
              duration: 3.3,
              ease: "easeInOut",
            },
          },
        }}
        whileHover={{ scaleY: 1 }}
        style={{ originY: 1 }}
        className="w-1/5 h-[80%] bg-primary rounded-t hover:bg-primary/95 transition-colors cursor-pointer"
      />
      <motion.div
        variants={{
          initial: { scaleY: 1 },
          hover: {
            scaleY: [1, 1.25, 0.75, 1],
            transition: {
              repeat: Infinity,
              repeatType: "mirror",
              duration: 3.4,
              ease: "easeInOut",
            },
          },
        }}
        whileHover={{ scaleY: 1 }}
        style={{ originY: 1 }}
        className="w-1/5 h-[50%] bg-primary/80 rounded-t hover:bg-primary/95 transition-colors cursor-pointer"
      />
    </div>
  );
};
