import { HeroSection } from "./hero-section";

export default function Hero() {
  return (
    <HeroSection
      id="hero"
      // title="No app required • Setup in minutes"
      subtitle={{
        regular: "Let Customers Order From Their Table",
        gradient: "Using a QR Code",
      }}
      description="Customers scan the table QR code, browse your menu, and place orders instantly. Reduce waiting time, serve faster, and manage everything in real time."
      ctaText="Get Started for Free"
      ctaHref="/signup"
      gridOptions={{
        angle: 65,
        opacity: 0.4,
        cellSize: 50,
        lightLineColor: "#9d9d9d",
        darkLineColor: "#5f5f5f",
      }}
    />
  );
}
