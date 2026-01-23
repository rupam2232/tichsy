"use client";
import { SigninForm } from "@/components/signin-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ScrollArea } from "@repo/ui/components/scroll-area";

export default function SigninModal() {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState<boolean>(
    pathname === "/signin" || pathname.includes("/signin"),
  );
  return (
    <>
      <Dialog
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) {
            router.replace("/");
          }
        }}
      >
        <DialogTrigger className="hidden">Open Dialog</DialogTrigger>
        <DialogContent className="gap-0 rounded-xl w-full max-w-sm md:min-w-3xl p-1 md:p-0 border-0">
          <ScrollArea className="overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="sr-only">Sign In</DialogTitle>
            </DialogHeader>
            <SigninForm
              setDrawerOpen={setDrawerOpen}
              cardClassName="border-0"
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
