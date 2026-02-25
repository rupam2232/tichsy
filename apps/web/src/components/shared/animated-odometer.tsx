"use client";

import { motion } from "motion/react";
import { cn } from "@repo/ui/lib/utils";

export interface AnimatedNumberProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "prefix"> {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  ...rest
}: AnimatedNumberProps) {
  const formattedValue = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

  return (
    <span
      className={cn(
        "inline-flex items-center tabular-nums overflow-visible pointer-events-none select-none",
        className,
      )}
      {...rest}
    >
      {prefix && <span className="mr-0.5">{prefix}</span>}
      <span className="flex items-center">
        {formattedValue.split("").map((char, i) => {
          // Keep a stable key indexing from the right of the string.
          // This way, the "1s", "10s", etc. digits map consistently as the number grows.
          const key = formattedValue.length - i;
          return <Digit key={key} char={char} />;
        })}
      </span>
      {suffix && <span className="ml-0.5">{suffix}</span>}
    </span>
  );
}

function Digit({ char }: { char: string }) {
  const isNumber =
    !isNaN(Number(char)) && char !== " " && char !== "." && char !== ",";

  if (!isNumber) {
    // Render static characters like commas and decimals directly
    return <span className="inline-block tabular-nums pb-[0.1em]">{char}</span>;
  }

  const num = Number(char);

  return (
    <span className="inline-flex h-[1em] overflow-hidden leading-none tabular-nums relative w-[1ch]">
      <motion.span
        initial={{ y: "0%" }}
        animate={{ y: `-${num * 10}%` }}
        transition={{
          duration: 1, // FAST exactly 1-second scroll
          ease: [0.22, 1, 0.36, 1], // Smooth exponential curve for an "odometer" feel
        }}
        className="absolute inset-x-0 top-0 flex flex-col"
      >
        {/* Render columns of 0 to 9 so it slides vertically exactly down to the target number */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <span key={i} className="h-[1em] flex items-center justify-center">
            {i}
          </span>
        ))}
      </motion.span>
    </span>
  );
}
