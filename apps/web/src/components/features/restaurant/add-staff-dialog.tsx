import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { z } from "zod";
import { sendInviteSchema } from "@repo/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { InvitationType } from "@repo/types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";
import { useForm } from "react-hook-form";
import { Input } from "@repo/ui/components/input";
import { Plus, Send } from "lucide-react";
import axios from "@/utils/axiosInstance";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import type { ApiResponse } from "@repo/types";

const AddStaffDialog = ({ 
  restaurantSlug, 
  onInviteSuccess 
}: { 
  restaurantSlug: string;
  onInviteSuccess?: (invitation: InvitationType) => void;
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const router = useRouter();
  
  const form = useForm<z.infer<typeof sendInviteSchema>>({
    resolver: zodResolver(sendInviteSchema),
    defaultValues: {
      email: "",
    },
  });

  useEffect(() => {
    const handlePopState = () => {
      setIsDialogOpen(false);
      form.reset();
    };

    if (isDialogOpen) {
      window.addEventListener("popstate", handlePopState);
    }
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isDialogOpen, form]);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setIsDialogOpen(true);
      window.history.pushState(null, "", window.location.href);
    } else {
      router.back();
    }
  };

  const onSubmit = async (data: z.infer<typeof sendInviteSchema>) => {
    const toastId = toast.loading("Sending invite...");
    try {
      const response = await axios.post(
        `/invitation/${restaurantSlug}/send`,
        data,
      );
      toast.success(
        response.data.message || "Staff member added successfully",
        { id: toastId },
      );
      if (onInviteSuccess && response.data.data) {
        onInviteSuccess(response.data.data);
      }
      form.reset();
      router.back();
    } catch (error) {
      console.error("Failed to add staff member:", error);
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Failed to add staff member. Please try again later.",
        { id: toastId },
      );
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Add Staff
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="p-6">
          <DialogTitle>Add Staff</DialogTitle>
          <DialogDescription>
            Invite a new staff member to your restaurant by entering their email
            address below
          </DialogDescription>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-4 mt-3">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="email">Email</FormLabel>
                      <FormControl>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter staff email"
                          autoComplete="email"
                          required
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <>Sending invite...</>
                  ) : (
                    <>
                      Send Invite <Send />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default AddStaffDialog;
