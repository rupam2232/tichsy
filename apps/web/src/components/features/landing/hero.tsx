"use client";
import { HeroSection } from "./hero-section-dark";

export default function Hero() {
  return (
    <HeroSection
      title="Modern POS for Restaurants"
      subtitle={{
        regular: "Simplify your workflow with",
        gradient: " our all-in-one solution",
      }}
      description="Simplify orders, manage tables, and accept payments — all powered by QR codes."
      ctaText="Get Started"
      ctaHref="/signup"
      // bottomImage={{
      //   light: "https://www.launchuicomponents.com/app-light.png",
      //   dark: "https://www.launchuicomponents.com/app-dark.png",
      // }}
      gridOptions={{
        angle: 65,
        opacity: 0.4,
        cellSize: 50,
        lightLineColor: "#4a4a4a",
        darkLineColor: "#6e6e6e",
      }}
      className="h-screen"
    />
  );
}
