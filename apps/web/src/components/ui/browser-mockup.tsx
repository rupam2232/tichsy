import * as React from "react";
import { cn } from "@repo/ui/lib/utils";

export function BrowserMockup({
  className,
  headerClassName,
  children,
  ...props
}: React.ComponentProps<"div"> & { headerClassName?: string }) {
  return (
    <div
      className={cn(
        "relative w-full max-w-lg mx-auto rounded-2xl border border-neutral-200/20 bg-neutral-900 overflow-hidden shadow-2xl flex flex-col group",
        className,
      )}
      {...props}
    >
      {/* Mockup Header (Apple macOS style) */}
      <div
        className={cn(
          "flex items-center px-4 py-3 bg-neutral-800/80 border-b border-neutral-700/50 backdrop-blur-md relative z-20",
          headerClassName,
        )}
      >
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400 shadow-sm" />
          <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-sm" />
          <div className="w-3 h-3 rounded-full bg-green-400 shadow-sm" />
        </div>
      </div>

      {/* Subtle decorative glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0" />

      {/* Main Content Area */}
      <div className="relative flex-1 flex flex-col w-full h-full p-2 z-10 overflow-hidden items-center justify-center">
        {children}
      </div>
    </div>
  );
}
