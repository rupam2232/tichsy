"use client";

import { Button } from "@repo/ui/components/button";
import { Moon, Sun } from "lucide-react";
import React from "react";
import { useTheme } from "next-themes";
import { IconDeviceDesktop } from "@tabler/icons-react";
import { cn } from "@repo/ui/lib/utils";

const ToggleTheme = ({ className }: React.HTMLAttributes<HTMLDivElement>) => {
  const { theme, setTheme } = useTheme();
  return (
    <div className={cn("flex items-center border rounded-md", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme("dark")}
        className={cn(
          "relative border-r border-accent rounded-r-none transition-colors",
          theme === "dark" && "bg-accent dark:bg-accent/50"
        )}
      >
        <Moon
          className={cn(
            "text-primary-foreground",
            theme === "dark" ? "fill-primary-foreground" : "fill-none"
          )}
        />
        <span className="sr-only">Dark Theme</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme("light")}
        className={cn(
          "relative border-r border-accent rounded-none transition-colors",
          theme === "light" && "bg-accent dark:bg-accent/50"
        )}
      >
        <Sun
          className={cn(
            "text-primary-foreground",
            theme === "light" ? "fill-primary-foreground" : "fill-none"
          )}
        />
        <span className="sr-only">Light Theme</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme("system")}
        className={cn(
          "relative rounded-l-none transition-colors",
          theme === "system" && "bg-accent dark:bg-accent/50"
        )}
      >
        <IconDeviceDesktop
          className={cn(
            "text-primary-foreground",
            theme === "system" ? "fill-primary-foreground" : "fill-none"
          )}
        />
        <span className="sr-only">System Theme</span>
      </Button>
    </div>
  );
};

export default ToggleTheme;
