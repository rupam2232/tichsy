"use client";
import { Button } from "@repo/ui/components/button";
import { motion } from "motion/react";

const plans = [
  { name: "Starter", price: "₹0", features: ["Up to 50 orders/mo", "Basic analytics", "1 Restaurant"] },
  { name: "Growth", price: "₹49/mo", features: ["Unlimited orders", "Advanced analytics", "Priority support"] },
  { name: "Enterprise", price: "Custom", features: ["Multi-location", "Dedicated support", "Custom integrations"] },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6 md:px-16 text-center">
      <h2 className="text-4xl font-bold mb-12">Simple Pricing</h2>
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.2 }}
            className="p-8 bg-accent/30 rounded-xl hover:bg-accent/50 transition"
          >
            <h3 className="text-2xl font-semibold mb-4">{p.name}</h3>
            <p className="text-3xl font-bold text-primary mb-6">{p.price}</p>
            <ul className="space-y-2 mb-6 text-primary-foreground/50">
              {p.features.map((f, idx) => (
                <li key={idx}>✓ {f}</li>
              ))}
            </ul>
            <Button className="px-6 py-3">
              Get Started
            </Button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
