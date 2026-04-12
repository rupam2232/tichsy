"use client";

import ToggleTheme from "@/components/shared/toggle-theme";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { FadeUp } from "@/components/shared/fade-up";

export function useMediaQuery(query: string) {
  const [value, setValue] = useState(false);

  useEffect(() => {
    // Handle initial check and subsequent changes
    function checkQuery() {
      const result = window.matchMedia(query);
      setValue(result.matches);
    }

    // Check immediately
    checkQuery();

    // Add resize listener
    window.addEventListener("resize", checkQuery);

    // Add media query change listener
    const mediaQuery = window.matchMedia(query);
    mediaQuery.addEventListener("change", checkQuery);

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkQuery);
      mediaQuery.removeEventListener("change", checkQuery);
    };
  }, [query]);

  return value;
}

const footerLinks = [
  {
    title: "Product",
    links: [
      { id: 1, title: "Features", url: "/#features" },
      { id: 2, title: "Pricing", url: "/pricing" },
    ],
  },
  {
    title: "Socials",
    links: [
      { id: 3, title: "LinkedIn", url: "https://linkedin.com/in/rupam2232" },
      { id: 4, title: "X/Twitter", url: "https://x.com/rupam2232" },
      { id: 5, title: "Github", url: "https://github.com/rupam2232/tichsy" },
    ],
  },
  {
    title: "Legal",
    links: [
      { id: 6, title: "Terms of Service", url: "/terms" },
      { id: 7, title: "Privacy Policy", url: "/privacy" },
    ],
  },
];

export default function Footer() {
  const tablet = useMediaQuery("(max-width: 1024px)");
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxGridWidth, setMaxGridWidth] = useState<number | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries[0]) return;
      setMaxGridWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <footer id="footer" className="pt-30">
      <FadeUp delay={0} duration={0.8} yOffset={40} className="container mx-auto px-4">
        <div
          className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-start md:justify-between py-10"
          ref={containerRef}
        >
          <div className="flex flex-col items-start justify-start gap-y-3 md:max-w-xs mx-0">
            <Link href="/" className="flex items-center gap-1">
              <Image
                src="/black-transparent-icon.svg"
                className="block dark:hidden"
                alt="logo"
                width={30}
                height={30}
              />
              <Image
                src="/white-transparent-icon.svg"
                className="hidden dark:block"
                alt="logo"
                width={30}
                height={30}
              />
              <p className="text-xl font-bold tracking-tight text-foreground">
                Tichsy
              </p>
            </Link>
            <p className="text-muted-foreground text-sm">
              A modern QR ordering system for restaurants. Streamline orders,
              manage tables, and serve customers faster.
            </p>
            <ToggleTheme />
            <p className="text-muted-foreground text-sm text-center">
              © {new Date().getFullYear()} Tichsy. All rights reserved.
            </p>
          </div>
          <div className="pt-5 md:pt-0 md:w-1/2">
            <div className="flex flex-wrap gap-4 items-start justify-between md:flex-row gap-y-5 lg:pl-10">
              {footerLinks.map((column, columnIndex) => (
                <ul key={columnIndex} className="flex flex-col gap-y-2">
                  <li className="mb-2 text-sm font-semibold">{column.title}</li>
                  {column.links.map((link) => (
                    <li
                      key={link.id}
                      className="group inline-flex cursor-pointer items-center justify-start gap-1 text-[15px]/snug text-muted-foreground"
                    >
                      <Link href={link.url}>{link.title}</Link>
                      <div className="flex size-4 items-center justify-center border border-border rounded translate-x-0 transform opacity-0 transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:opacity-100">
                        <ChevronRightIcon className="h-4 w-4 " />
                      </div>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </div>
      </FadeUp>
      <div className="w-full relative z-0 overflow-hidden pt-4">
        <div className="absolute w-full h-17 top-4 bg-gradient-to-t from-transparent to-background z-10 from-40% pointer-events-none" />
        <FlickeringGrid
          text="TICHSY"
          fontSize={140}
          fitText={true}
          maxTextWidth={maxGridWidth}
          textVisibleRatio={0.7}
          className="w-full"
          squareSize={2}
          gridGap={tablet ? 2 : 3}
          color="#6B7280"
          maxOpacity={0.3}
          flickerChance={0.1}
          textBaseline="bottom"
        />
      </div>
    </footer>
  );
}
