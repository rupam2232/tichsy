"use client";

import { motion, AnimatePresence } from "motion/react";
import { Utensils, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { Phone } from "@/components/ui/phone";
import { IconQrcode } from "@tabler/icons-react";

export default function QrCodeAnimation() {
  // Stages: "scanning" -> "scanned" -> "menu"
  const [stage, setStage] = useState<"scanning" | "scanned" | "menu">(
    "scanning",
  );

  useEffect(() => {
    let scanTimeout: NodeJS.Timeout;
    let successTimeout: NodeJS.Timeout;
    let menuTimeout: NodeJS.Timeout;
    const cycleAnimation = () => {
      setStage("scanning");
      // Scan for 3 seconds
      scanTimeout = setTimeout(() => {
        setStage("scanned");
        // Show checkmark/success for 0.5s before showing menu
        successTimeout = setTimeout(() => {
          setStage("menu");
          // Stay on menu for 4 seconds before resetting
          menuTimeout = setTimeout(() => {
            cycleAnimation();
          }, 2000);
        }, 800);
      }, 2000);
    };

    cycleAnimation();
    return () => {
      clearTimeout(scanTimeout);
      clearTimeout(successTimeout);
      clearTimeout(menuTimeout);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-[200px] h-full pointer-events-none">
      <Phone>
        <AnimatePresence mode="wait">
          {stage === "scanning" && (
            <motion.div
              key="scanner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full w-full flex-col items-center justify-center bg-background p-6 rounded-4xl"
            >
              {/* Camera Viewfinder UI */}
              <div className="relative flex aspect-square w-full max-w-[180px] items-center justify-center rounded-lg border-2 border-border/50 bg-background/50 backdrop-blur-sm">
                {/* QR Code Placeholder */}
                <IconQrcode className="h-24 w-24 text-primary" />

                {/* Scanning Beam */}
                <motion.div
                  initial={{ top: 0, opacity: 0 }}
                  animate={{ top: "100%", opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 h-1 w-full bg-gradient-to-r from-transparent via-green-400 to-transparent shadow-[0_0_15px_rgba(74,222,128,0.5)]"
                />

                {/* Corner Markers */}
                <div className="absolute -top-1 -left-1 h-6 w-6 border-l-4 border-t-4 border-green-500 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 h-6 w-6 border-r-4 border-t-4 border-green-500 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 h-6 w-6 border-l-4 border-b-4 border-green-500 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 h-6 w-6 border-r-4 border-b-4 border-green-500 rounded-br-lg" />
              </div>

              <motion.p
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="mt-6 text-xs font-medium text-muted-foreground"
              >
                Scan QR Code
              </motion.p>
            </motion.div>
          )}

          {(stage === "scanned" || stage === "menu") && (
            <motion.div
              key="app-ui"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full w-full flex-col bg-background/80 font-sans rounded-4xl"
            >
              {/* App Header */}
              <div className="flex items-center justify-between border-b border-background/10 bg-background/50 pt-8 backdrop-blur-md rounded-t-4xl p-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <Utensils className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold">
                      Modern Eats
                    </h3>
                    <p className="text-[10px] text-muted-foreground">Table 12</p>
                  </div>
                </div>
                <div className="rounded-full bg-muted p-1.5 text-muted-foreground">
                  <ShoppingBag className="h-4 w-4" />
                </div>
              </div>

              {/* Menu Items (Staggered Animation) */}
              <div className="flex-1 space-y-3 overflow-hidden p-4">
                {/* Category Tabs */}
                <div className="flex gap-1.5 mb-4 overflow-hidden">
                  <div className="rounded-full bg-primary/20 px-2 py-1 text-[10px] font-medium text-primary">
                    All
                  </div>
                  <div className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-medium text-muted-foreground/70 bg-muted">
                    Burgers
                  </div>
                  <div className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-medium text-muted-foreground/70 bg-muted">
                    Drinks
                  </div>
                </div>

                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 + 0.2 }}
                    className="flex gap-2 rounded-xl border bg-muted/70 p-3"
                  >
                    <div className="h-8 w-8 rounded-lg bg-secondary-foreground/30 object-cover aspect-square" />
                    <div className="flex-1">
                      <div className="h-2 rounded bg-secondary-foreground/40 mb-2" />
                      <div className="h-1.5 w-3/4 rounded bg-secondary-foreground/20" />
                    </div>
                    <div className="mt-auto rounded bg-primary/20 px-2 py-0.5 text-[10px] text-primary">
                      ₹{12 + i}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Checkout Button */}
              <motion.div
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                className="p-4 pt-0 pb-8"
              >
                <div className="w-full rounded-xl bg-primary py-3 text-center text-xs font-semibold shadow-lg shadow-green-900/20 cursor-pointer">
                  View Cart
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Phone>
    </div>
  );
}
