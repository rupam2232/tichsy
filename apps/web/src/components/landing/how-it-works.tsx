"use client";
import { BrowserMockup } from "@/components/ui/browser-mockup";
import { Phone } from "@/components/ui/phone";
import { useEffect, useRef, useState } from "react";
import { cn } from "@repo/ui/lib/utils";
import { FadeIn, FadeUp } from "@/components/shared/fade-up";

type MockupType = "browser" | "phone";

const steps = [
  {
    title: "Create Your Restaurant",
    description:
      "Set up your restaurant in minutes by adding your name and logo. Start for free with no credit card required.",
    video:
      "https://res.cloudinary.com/rupam-mondal/video/upload/w_700,q_auto/v1775227119/tichsy-create-restaurant_oeulgv.mp4",
    mockup: "browser" as MockupType,
  },
  {
    title: "Add Your Menu and Tables",
    description:
      "Add food items, set prices, and create tables. Each table gets a unique QR code ready to print and use.",
    video:
      "https://res.cloudinary.com/rupam-mondal/video/upload/w_700,q_auto/v1775226832/tichsy-create-table-and-menu_dj4pj5.mp4",
    mockup: "browser" as MockupType,
  },
  {
    title: "Customers Scan and Order",
    description:
      "Customers scan the QR code at their table, browse your menu, and place orders instantly. No app. No login. No waiting.",
    mockup: "phone" as MockupType,
    video:
      "https://res.cloudinary.com/rupam-mondal/video/upload/w_700,q_auto/v1775228383/tichsy-menu-view_psthwd.mp4",
  },
  {
    title: "Get Orders in Real Time",
    description:
      "Orders appear instantly on your dashboard with table name and items, so your staff can prepare and serve without confusion.",
    mockup: "browser" as MockupType,
    video:
      "https://res.cloudinary.com/rupam-mondal/video/upload/w_700,q_auto/v1775246873/tichsy-new-order-video_mrfgft.mp4",
  },
];

const StepVideo = ({ src, playing }: { src: string; playing: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    if (playing) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } else {
      videoRef.current.pause();
    }
  }, [playing]);

  return (
    <video
      ref={videoRef}
      src={src}
      loop
      muted
      playsInline
      controls={false}
      preload="metadata"
      className="w-full h-full object-cover rounded-xl shadow-sm"
    />
  );
};

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      // 1. Basic bounds check to entirely pause when out of section
      if (sectionRef.current) {
        const sectionRect = sectionRef.current.getBoundingClientRect();
        if (sectionRect.bottom < 0 || sectionRect.top > window.innerHeight) {
          setActiveStep(-1);
          return;
        }
      }

      const rects = stepRefs.current.map((ref) => ref?.getBoundingClientRect());
      const H = window.innerHeight;

      const DOMINANCE_THRESHOLD = H * 0.5; // When a sticky step crosses the middle of the screen, it visually dominates the stack
      const VISIBILITY_THRESHOLD = H * 0.8; // When a step enters 20% from the bottom of the screen

      let foundActive = -1;

      // 2. Prioritize dominance in reverse order
      // Because steps stack, the highest index step that crosses the mid-screen threshold is the one visually on top
      for (let i = rects.length - 1; i >= 0; i--) {
        const rect = rects[i];
        if (rect && rect.top < DOMINANCE_THRESHOLD) {
          foundActive = i;
          break;
        }
      }

      // 3. Fallback for the very first step entering the screen
      // If no step has reached the dominance threshold (e.g., Step 1 is just entering the bottom),
      // we check if any step is at least partially visible (20%).
      if (foundActive === -1) {
        for (let i = 0; i < rects.length; i++) {
          const rect = rects[i];
          if (rect && rect.top < VISIBILITY_THRESHOLD && rect.bottom > 0) {
            foundActive = i;
            break;
          }
        }
      }

      setActiveStep((prev) => (prev !== foundActive ? foundActive : prev));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Run once on mount
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="container mx-auto px-4 pt-30"
    >
      <FadeUp delay={0.2} duration={0.8} yOffset={40}>
        <div className="text-center mb-20">
          <h1 className="text-3xl md:text-4xl lg:text-5xl tracking-tighter font-geist bg-clip-text text-transparent mx-auto bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.55)_100%)] dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] lg:leading-tight max-w-4xl mb-4">
            From Setup to First Order in Minutes
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto font-normal">
            Set up your restaurant, place QR codes on tables, and start
            receiving orders instantly. No extra hardware. No training required.
          </p>
        </div>
      </FadeUp>
      <div className="flex flex-col gap-24 lg:gap-32 max-w-6xl mx-auto relative">
        {steps.map((step, index) => {
          const isEven = index % 2 === 0;
          const isPlaying = activeStep === index;

          return (
            <div
              key={index}
              ref={(el) => {
                stepRefs.current[index] = el;
              }}
              className={cn(
                "lg:sticky lg:top-15 py-6 bg-background",
                isEven ? "lg:flex-row" : "lg:flex-row-reverse",
              )}
            >
              <FadeIn delay={0.2} duration={0.8}>
                <div
                  className={cn(
                    "flex flex-col gap-12 lg:gap-20 items-center",
                    isEven ? "lg:flex-row" : "lg:flex-row-reverse",
                  )}
                >
                  {/* Text Content */}
                  <div className="flex-1 space-y-6 w-full lg:w-1/2 text-center">
                    <h3 className="text-xl md:text-2xl tracking-tighter font-medium mx-auto lg:leading-tight max-w-4xl bg-clip-text text-transparent bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.55)_100%)] dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)]">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground font-normal text-sm max-w-2xl mx-auto">
                      {step.description}
                    </p>
                  </div>

                  {/* Media / Media Placeholder */}
                  <div className="flex-1 w-full lg:w-1/2 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-transparent z-15" />
                    {step.mockup === "phone" ? (
                      <Phone
                        className="w-1/2! sm:w-[200px]!"
                        videoSrc={step.video}
                        playing={isPlaying}
                      />
                    ) : (
                      <BrowserMockup
                        className="aspect-[4/3] bg-card"
                        headerClassName="bg-muted"
                      >
                        <StepVideo src={step.video} playing={isPlaying} />
                      </BrowserMockup>
                    )}
                  </div>
                </div>
              </FadeIn>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default HowItWorks;
