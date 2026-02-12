import { HeroSection } from "./hero-section";

export default function Hero() {
  return (
    <HeroSection
      title={`Introducing ${process.env.NEXT_PUBLIC_APP_NAME}`}
      subtitle={{
        regular: "Modernize Operations with",
        gradient: "Seamless QR Ordering",
      }}
      description="Empower your restaurant with lightning-fast orders and real-time table management. Delight guests and boost revenue effortlessly."
      ctaText="Start Your 7-Day Free Trial"
      ctaHref="/signup"
      gridOptions={{
        angle: 65,
        opacity: 0.4,
        cellSize: 50,
        lightLineColor: "#4a4a4a",
        darkLineColor: "#6e6e6e",
      }}
    />
  );
}
