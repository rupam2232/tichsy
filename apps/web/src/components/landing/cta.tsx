import { Button } from "@repo/ui/components/button";
import Link from "next/link";
import { Glow } from "../ui/glow";
import { FadeUp } from "@/components/shared/fade-up";

export default function CTA() {
  return (
    <section id="cta" className="mx-auto container px-4 pt-30">
      <FadeUp delay={0.2} duration={0.8} yOffset={40}>
        <div className="max-w-6xl mx-auto relative group overflow-hidden rounded-3xl px-4 sm:px-16 py-16 text-center">
          <div className="mx-auto mb-10 z-10 relative">
            <h1 className="text-3xl md:text-4xl lg:text-5xl tracking-tighter font-geist mx-auto lg:leading-tight max-w-3xl mb-4">
              Start Letting Customers Order From Their Table
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto font-normal">
              Create your restaurant, add your menu, and start taking orders
              right away. No setup hassle, no extra hardware.
            </p>
          </div>

          <div className="flex flex-col gap-2 items-center relative z-10">
            <Button
              size="lg"
              variant="secondary"
              className="gap-2 font-semibold dark:bg-white dark:text-black bg-black hover:bg-black/80 text-white w-min"
              asChild
            >
              <Link href="/signup">Create Your Restaurant for Free</Link>
            </Button>
            <p className="text-muted-foreground font-normal text-sm bg-card/8 px-4 py-0.5 rounded-xl">
              No credit card required • Free plan available • Setup in minutes
            </p>
          </div>
          <div className="absolute left-0 top-0 h-full w-full translate-y-[1rem] opacity-80 transition-all duration-500 ease-in-out group-hover:translate-y-[-2rem] group-hover:opacity-100">
            <Glow variant="bottom" className="animate-appear-zoom delay-300" />
          </div>
        </div>
      </FadeUp>
    </section>
  );
}
