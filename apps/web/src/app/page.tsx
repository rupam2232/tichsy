import Navbar from "@/components/features/landing/navbar";
import Hero from "@/components/features/landing/hero";
// import Showcase from "@/components/features/landing/showcase";
import Features from "@/components/features/landing/features";
import Pricing from "@/components/features/landing/pricing";
import CTA from "@/components/features/landing/cta";
import Footer from "@/components/features/landing/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      {/* <Showcase /> */}
      <Features />
      <Pricing />
      <CTA />
      <Footer />
    </>
  );
}
