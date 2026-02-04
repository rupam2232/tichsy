"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { useEffect, useState } from "react";
import FoodOrderStepsForStaffs from "@/components/features/orders/food-order-steps-for-staffs";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { Plus } from "lucide-react";

const StaffOrderDialog = () => {
  const [step, setStep] = useState<number>(1);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const router = useRouter();

  function handleDialogClose(open: boolean) {
    if (open) {
      setIsDialogOpen(true);
      window.history.pushState(null, "", window.location.href);
    } else {
      router.back();
    }
  }

  useEffect(() => {
    const handlePopState = () => {
      setIsDialogOpen(false);
      setStep(1);
    };

    if (isDialogOpen) {
      window.addEventListener("popstate", handlePopState);
    }
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isDialogOpen]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          New Order
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-screen flex flex-col h-[90vh]"
        aria-describedby={undefined}
      >
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
