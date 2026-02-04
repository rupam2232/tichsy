"use client";

import { useEffect } from "react";
import { Button } from "@repo/ui/components/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("APP_ERROR:", error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background text-foreground">
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="h-10 w-10" />
        <h1 className="text-2xl font-bold tracking-tight">
          Something went wrong!
        </h1>
      </div>
      <p className="max-w-[500px] text-center text-muted-foreground">
        An unexpected error occurred. Our team has been notified.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()} variant="default">
          Try again
        </Button>
        <Link href="/home">
          <Button variant="outline">
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
