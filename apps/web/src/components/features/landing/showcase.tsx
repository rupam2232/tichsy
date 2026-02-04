"use client";
import { motion } from "motion/react";
// import Image from "next/image";

export default function Showcase() {
  return (
    <section className="py-24 px-6 md:px-16 text-center">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-4xl font-bold mb-12"
      >
        See Tichsy in Action
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true }}
        className="max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-lg"
      >
        {/* <Image src="/demo-dashboard.png" alt="Tichsy Dashboard" fill /> */}
      </motion.div>
    </section>
  );
}
