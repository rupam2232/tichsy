import Hero from "@/components/features/landing/hero";
import Features from "@/components/features/landing/features";
import CTA from "@/components/features/landing/cta";
import Faq from "@/components/features/landing/faq";

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <Faq />
      <CTA />
    </>
  );
}
