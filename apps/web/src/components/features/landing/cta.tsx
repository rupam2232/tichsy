"use client";
import { Button } from "@repo/ui/components/button";
import { motion } from "motion/react";

export default function CTA() {
  return (
    <section className="py-24 text-center px-6 md:px-16 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/70 via-background/50 to-background"></div>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-4xl font-bold mb-6"
      >
        Ready to Modernize Your Restaurant?
      </motion.h2>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="flex justify-center gap-4"
      >
        <Button className="px-6 py-3">Start Free</Button>
        <Button variant="outline" className="px-6 py-3">Book Demo</Button>
      </motion.div>
    </section>
  );
}
