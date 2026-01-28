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
import { addStaffSchema } from "@/schemas/restaurantSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
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
import type { ApiResponse } from "@repo/ui/types/ApiResponse";

const AddStaffDialog = ({ restaurantSlug }: { restaurantSlug: string }) => {
  const form = useForm<z.infer<typeof addStaffSchema>>({
    resolver: zodResolver(addStaffSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof addStaffSchema>) => {
    try {
      const response = await axios.post(
        `/restaurant/${restaurantSlug}/staff`,
        data
      );
      toast.success(response.data.message || "Staff member added successfully");
      form.reset();
    } catch (error) {
      console.error("Failed to add staff member:", error);
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Failed to add staff member. Please try again later."
      );
    }
  };

  return (
    <Dialog>
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
            address below.
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
                      <FormDescription>
                        The email address of the staff member. It will be used
                        for login and notifications.
                        <span className="text-muted-foreground block">
                          Note: All staff members must have unique email
                          addresses.
                        </span>
                      </FormDescription>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Send Invite <Send />
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
