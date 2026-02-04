"use client";
import * as React from "react";
import { cn } from "@repo/ui/lib/utils";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, Transition } from "motion/react";

interface HeroSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: {
    regular: string;
    gradient: string;
  };
  description?: string;
  ctaText?: string;
  ctaHref?: string;
  bottomImage?: {
    light: string;
    dark: string;
  };
  gridOptions?: {
    angle?: number;
    cellSize?: number;
    opacity?: number;
    lightLineColor?: string;
    darkLineColor?: string;
  };
}

interface RetroGridProps {
  angle?: number;
  cellSize?: number;
  opacity?: number;
  lightLineColor?: string;
  darkLineColor?: string;
}

const RetroGrid = ({
  angle = 65,
  cellSize = 60,
  opacity = 0.5,
  lightLineColor = "gray",
  darkLineColor = "gray",
}: RetroGridProps) => {
  const gridStyles = {
    "--grid-angle": `${angle}deg`,
    "--cell-size": `${cellSize}px`,
    "--opacity": opacity,
    "--light-line": lightLineColor,
    "--dark-line": darkLineColor,
  } as React.CSSProperties;

  return (
    <div
      className={cn(
        "pointer-events-none absolute size-full overflow-hidden [perspective:200px]",
        `opacity-[var(--opacity)]`
      )}
      style={gridStyles}
    >
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
        <div className="animate-grid [background-image:linear-gradient(to_right,var(--light-line)_1px,transparent_0),linear-gradient(to_bottom,var(--light-line)_1px,transparent_0)] [background-repeat:repeat] [background-size:var(--cell-size)_var(--cell-size)] [height:300vh] [inset:0%_0px] [margin-left:-200%] [transform-origin:100%_0_0] [width:600vw] dark:[background-image:linear-gradient(to_right,var(--dark-line)_1px,transparent_0),linear-gradient(to_bottom,var(--dark-line)_1px,transparent_0)]" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent to-90% dark:from-black" />
    </div>
  );
};

const HeroSection = React.forwardRef<HTMLDivElement, HeroSectionProps>(
  (
    {
      className,
      title,
      subtitle = {
        regular: "",
        gradient: "",
      },
      description,
      ctaText,
      ctaHref = "#",
      bottomImage,
      gridOptions,
      ...props
    },
    ref
  ) => {
    const fadeUpVariants = {
      hidden: { opacity: 0, y: 30 },
      visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
          duration: 1,
          delay: 0.5 + i * 0.2,
          ease: [0.25, 0.4, 0.25, 1] as Transition['ease'],
        },
      }),
    };

    return (
      <div className={cn("relative", className)} ref={ref} {...props}>
        <div className="absolute top-0 z-[0] h-full w-full bg-primary/10 bg-[radial-gradient(ellipse_20%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_20%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        <section className="relative h-full max-w-full mx-auto z-1">
          <RetroGrid {...gridOptions} />
          <div className="max-w-screen-xl z-10 mx-auto px-4 py-28 gap-12 md:px-8">
            <div className="space-y-5 max-w-3xl lg:leading-5 mx-auto text-center">
              <motion.div
                custom={0}
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-secondary-foreground/[0.03] border border-secondary-foreground/[0.08] mb-8 md:mb-12"
              >
                <span className="text-sm text-muted-foreground tracking-wide">
                  {title}
                </span>
                <ChevronRight className="inline w-4 h-4 ml-2 group-hover:translate-x-1 duration-300" />
              </motion.div>

              <motion.div
                custom={1}
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
              >
                <h1 className="text-4xl tracking-tighter font-geist bg-clip-text text-transparent mx-auto md:text-6xl bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.75)_100%)] dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)]">
                  {subtitle.regular}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-500 dark:from-emerald-300 dark:to-green-200">
                    {subtitle.gradient}
                  </span>
                </h1>
              </motion.div>

              <motion.div
                custom={2}
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
              >
                <p className="max-w-2xl mx-auto text-gray-800 dark:text-gray-300">
                  {description}
                </p>
              </motion.div>

              <motion.div
                custom={3}
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                className="items-center justify-center gap-x-3 space-y-3 sm:flex sm:space-y-0"
              >
                <span className="relative inline-block overflow-hidden rounded-full p-[1.5px]">
                  <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#CBFFE3_0%,#68D255_50%,#3EA606_100%)]  dark:bg-[conic-gradient(from_90deg_at_50%_50%,#FFFFFF_0%,#7BD298_50%,#54D368_100%)]" />
                  <div className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white dark:bg-gray-950 text-xs font-medium backdrop-blur-3xl">
                    <Link
                      href={ctaHref}
                      className="inline-flex rounded-full text-center group items-center w-full justify-center bg-gradient-to-tr from-zinc-300/20 via-green-400/30 to-transparent dark:from-zinc-300/5 dark:via-green-400/20 text-gray-900 dark:text-white border-input border-[1px] hover:bg-gradient-to-tr hover:from-zinc-300/30 hover:via-green-400/40 hover:to-transparent dark:hover:from-zinc-300/10 dark:hover:via-green-400/30 transition-all sm:w-auto py-4 px-10"
                    >
                      {ctaText}
                    </Link>
                  </div>
                </span>
              </motion.div>
            </div>
            {bottomImage && (
              <div className="mt-32 mx-10 relative z-10">
                <Image
                  src={bottomImage.light}
                  className="w-full shadow-lg rounded-lg border border-gray-200 dark:hidden"
                  alt="Dashboard preview"
                  fill
                />
                <Image
                  src={bottomImage.dark}
                  className="hidden w-full shadow-lg rounded-lg border border-gray-800 dark:block"
                  alt="Dashboard preview"
                  fill
                />
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }
);
HeroSection.displayName = "HeroSection";

export { HeroSection };
