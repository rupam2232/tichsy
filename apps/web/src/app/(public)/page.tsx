import Hero from "@/components/landing/hero";
import Features from "@/components/landing/features";
import CTA from "@/components/landing/cta";
import Faq from "@/components/landing/faq";
import HowItWorks from "@/components/landing/how-it-works";

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Features />
      <Faq />
      <CTA />
    </>
  );
}
