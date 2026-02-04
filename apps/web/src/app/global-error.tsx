"use client";

import { Button } from "@repo/ui/components/button";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("GLOBAL_ERROR:", error);
  }, [error]);

  return (
    <html>
      <body className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background text-foreground">
        <h1 className="text-3xl font-bold">Something went wrong!</h1>
        <p className="text-muted-foreground">
          A critical error occurred in the application.
        </p>
        <Button onClick={() => reset()}>Try again</Button>
      </body>
    </html>
  );
}
