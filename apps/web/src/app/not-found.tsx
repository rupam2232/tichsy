import Link from "next/link";
import { Button } from "@repo/ui/components/button";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background text-foreground">
      <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">404</h1>
      <h2 className="text-xl font-medium text-muted-foreground">
        Page Not Found
      </h2>
      <p className="max-w-[500px] text-center text-muted-foreground">
        Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Button asChild>
        <Link href="/home">Back to Home</Link>
      </Button>
    </div>
  );
}
