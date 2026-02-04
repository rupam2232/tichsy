"use client";
import { motion } from "motion/react";
import { Utensils, Bell, BarChart3, CreditCard } from "lucide-react";

const features = [
  { icon: Utensils, title: "QR Ordering", desc: "Customers scan, order, and pay instantly." },
  { icon: Bell, title: "Real-time Alerts", desc: "Staff notified instantly on new orders." },
  { icon: BarChart3, title: "Analytics", desc: "Track sales, dishes, and customer trends." },
  { icon: CreditCard, title: "Payments", desc: "Supports online and cash transactions." },
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-6 md:px-16 text-center">
      {/* <h2 className="text-4xl font-bold mb-12">Key Features</h2> */}
      <div className="grid md:grid-cols-4 gap-8">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.2 }}
            className="p-6 bg-accent/30 rounded-xl hover:bg-accent/50 transition"
          >
            <f.icon className="mx-auto mb-4 h-10 w-10 text-primary" />
            <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
            <p className="text-primary-foreground/50">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
