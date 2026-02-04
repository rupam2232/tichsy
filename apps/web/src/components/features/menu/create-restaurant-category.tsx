import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Loader2, Plus } from "lucide-react";
import { useRef } from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";
import { addCategorySchema } from "@repo/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store/store";
import axios from "@/utils/axiosInstance";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { ApiResponse } from "@repo/ui/types/ApiResponse";
import { signOut } from "@/store/authSlice";
import { useRouter } from "next/navigation";

const CreateRestaurantCategory = ({
  setCategories,
  categories,
  restaurantSlug,
  isLoading = false,
  setIsLoading,
}: {
  setCategories?: React.Dispatch<React.SetStateAction<string[]>>;
  categories: string[];
  restaurantSlug: string;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const closeDialog = useRef<HTMLButtonElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const form = useForm<z.infer<typeof addCategorySchema>>({
    resolver: zodResolver(addCategorySchema),
    defaultValues: {
      category: "",
    },
  });

  const createCategory = form.handleSubmit(async (data) => {
    if (categories.includes(data.category)) {
      toast.error("Category already exists");
      return;
    }
    if (isLoading) return;
    try {
      setIsLoading(true);
      const response = await axios.post(
        `/restaurant/${restaurantSlug}/categories`,
        data,
      );
      if (setCategories) {
        setCategories((prev) => [...prev, data.category]);
      }
      toast.success(response.data.message || "Category created successfully");
      form.reset();
      closeDialog.current?.click();
    } catch (error) {
      console.error("Error creating category:", error);
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Error creating category. Please try again later.",
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push("/signin");
      }
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          form.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size="sm" className="w-full text-sm">
          <Plus /> New Category
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="categoryName">Category Name</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      id="categoryName"
                      placeholder="E.g., Fast Food"
                      className="w-full"
                      autoComplete="off"
                      required
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    Enter the name of the category you want to create.
                  </FormDescription>
                </FormItem>
              )}
            />
            <Button type="button" disabled={isLoading} onClick={createCategory}>
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Category"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
      <DialogClose ref={closeDialog} className="hidden" />
    </Dialog>
  );
};

export default CreateRestaurantCategory;
