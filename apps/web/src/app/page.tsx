import Navbar from "@/components/features/landing/navbar";
import Hero from "@/components/features/landing/hero";
import Features from "@/components/features/landing/features";
import CTA from "@/components/features/landing/cta";
import Footer from "@/components/features/landing/footer";
import Faq from "@/components/features/landing/faq";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <Faq />
      <CTA />
      <Footer />
    </>
  );
}
