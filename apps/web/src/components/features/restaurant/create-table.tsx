import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { signOut } from "@/store/authSlice";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/store/store";
import axios from "@/utils/axiosInstance";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { ApiResponse } from "@repo/ui/types/ApiResponse";
import { useEffect, useRef, useState } from "react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { tableSchema } from "@repo/types";
import type { AllTables } from "@repo/ui/types/Table";

const CreateTableDialog = ({
  children = "Create a New Table",
  isLoading = false,
  setAllTables,
  restaurantSlug,
}: {
  children?: React.ReactNode;
  isLoading: boolean;
  setAllTables: React.Dispatch<React.SetStateAction<AllTables | null>>;
  restaurantSlug: string;
}) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [formLoading, setformLoading] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const closeDialog = useRef<HTMLButtonElement>(null);
  const form = useForm<z.infer<typeof tableSchema>>({
    resolver: zodResolver(tableSchema),
    defaultValues: {
      tableName: "",
      seatCount: 1,
    },
  });

  const onSubmit = async (data: z.infer<typeof tableSchema>) => {
    if (isLoading || formLoading) return; // Prevent multiple submissions
    if (!user || user?.role !== "owner") {
      toast.error("You do not have permission to create a table");
      return;
    }
    try {
      setformLoading(true);
      const response = await axios.post(`/table/${restaurantSlug}`, data);
      if (!response.data.success || !response.data.data) {
        toast.error(response.data.message || "Failed to create table");
        return;
      }
      setAllTables((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          tables: [...prev.tables, response.data.data],
        };
      });
      form.reset();
      if (closeDialog.current) {
        closeDialog.current.click();
      }
      toast.success(response.data.message || "Table created successfully");
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "An error occurred during table creation",
      );
      console.error(
        axiosError.response?.data.message ||
          "An error occurred during table creation",
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push("/signin");
      }
    } finally {
      setformLoading(false);
    }
  };

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
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <ScrollArea className="overflow-y-auto max-h-[90vh]">
          <DialogHeader className="p-6">
            <DialogTitle className="mb-4">Create a New Table</DialogTitle>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="tableName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="tableName">Table Name</FormLabel>
                        <FormControl>
                          <Input
                            id="tableName"
                            type="text"
                            placeholder="E.g., Table 1"
                            autoComplete="off"
                            required
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Every table name must be unique
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="seatCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="seatCount">Seat Count</FormLabel>
                        <FormControl>
                          <Input
                            id="seatCount"
                            type="number"
                            placeholder="E.g., 4"
                            autoComplete="off"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.valueAsNumber)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Number of seats at this table
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || formLoading}
                  >
                    {formLoading ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Table"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogHeader>
        </ScrollArea>
      </DialogContent>
      <DialogClose ref={closeDialog}></DialogClose>
    </Dialog>
  );
};

export default CreateTableDialog;
