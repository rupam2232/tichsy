"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { useEffect, useState } from "react";
import FoodOrderStepsForStaffs from "@/components/food-order-steps-for-staffs";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { Plus } from "lucide-react";

const StaffOrderDialog = () => {
  const [step, setStep] = useState<number>(1);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const router = useRouter();

  function handleDialogClose(open: boolean) {
    setDrawerOpen(open);
    if (open) {
      window.history.pushState(null, "", window.location.href);
    } else {
      setStep(1);
      router.back();
    }
  }

  useEffect(() => {
    const handlePopState = () => {
      setDrawerOpen(false);
    };

    if (drawerOpen) {
      window.addEventListener("popstate", handlePopState);
    }
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [drawerOpen]);

  return (
    <Dialog open={drawerOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          New Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-screen flex flex-col h-[90vh]">
        <DialogHeader>
          <DialogTitle className="pb-2! px-6 pt-6">
            {step === 1
              ? "Select Table"
              : step === 2
                ? "Select Food Items"
                : "Confirm Order"}
          </DialogTitle>
        </DialogHeader>
        <FoodOrderStepsForStaffs
          step={step}
          setStep={setStep}
          className="flex-1 min-h-0"
          onClose={() => handleDialogClose(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default StaffOrderDialog;
