import { Button } from "@repo/ui/components/button";
import Link from "next/link";
import { Glow } from "./glow";

export default function CTA() {
  return (
    <section className="mx-auto sm:px-4 py-20 md:pb-20">
      <div className="relative group overflow-hidden rounded-3xl px-4 sm:px-16 py-16 text-center">
        <div className="mx-auto max-w-2xl relative z-10">
          <h2 className="text-4xl font-bold tracking-tighter text-primary-foreground sm:text-4xl md:text-5xl">
            Ready to modernize your restaurant ?
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/90">
            Join hundreds of restaurants streamlining their operations with{" "}
            {process.env.NEXT_PUBLIC_APP_NAME}. Start your free trial today.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row justify-center relative z-10">
          <Button
            size="lg"
            variant="secondary"
            className="gap-2 font-semibold dark:bg-white dark:text-black bg-black hover:bg-black/80 text-white"
            asChild
          >
            <Link href="/signup">Start Your 30-Day Free Trial Today</Link>
          </Button>
        </div>
        <div className="absolute left-0 top-0 h-full w-full translate-y-[1rem] opacity-80 transition-all duration-500 ease-in-out group-hover:translate-y-[-2rem] group-hover:opacity-100">
          <Glow variant="bottom" className="animate-appear-zoom delay-300" />
        </div>
      </div>
    </section>
  );
}
