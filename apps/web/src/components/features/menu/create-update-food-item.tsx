import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { FoodItemDetails, AllFoodItems, ApiResponse } from "@repo/types";
import { Form } from "@repo/ui/components/form";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { foodItemSchema } from "@repo/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import { Loader2, Pen, Plus } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/store/store";
import axios from "@/utils/axiosInstance";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { signOut } from "@/store/authSlice";
import { usePathname, useRouter } from "next/navigation";
import FoodItemBasicInfo from "./food-item-form/basic-info";
import FoodItemImageUpload from "./food-item-form/image-upload";
import FoodItemVariants from "./food-item-form/variants";

type CreateUpdateFoodItemProps = {
  isEditing?: boolean; // Optional prop to indicate if it's for editing an existing item
  foodItemDetails?: FoodItemDetails | null; // Optional prop to pass food item details when editing
  formLoading: boolean; // Optional prop to control form loading state
  setFormLoading: React.Dispatch<React.SetStateAction<boolean>>; // Optional prop to set form loading state
  restaurantSlug: string; // Required prop to identify the restaurant
  setFoodItemDetails?: React.Dispatch<
    React.SetStateAction<FoodItemDetails | null>
  >; // Optional prop to update food item details after creation or update
  setAllFoodItems: React.Dispatch<React.SetStateAction<AllFoodItems | null>>; // Optional prop to update all food items after creation or update
  categories?: string[]; // Optional prop to pass categories for the restaurant
  setCategories?: React.Dispatch<React.SetStateAction<string[]>>; // Optional prop to update categories after creation or update
  setTabName?: (tabName: string) => void; // Optional prop to set the current tab name
};

const CreateUpdateFoodItem = ({
  isEditing = false, // Default to false if not provided
  foodItemDetails,
  formLoading = false, // Optional prop to control form loading state
  setFormLoading, // Optional prop to set form loading state
  restaurantSlug,
  setFoodItemDetails, // Optional prop to update food item details after creation or update
  setAllFoodItems, // Optional prop to update all food items after creation or update
  categories = [], // Optional prop to pass categories for the restaurant
  setCategories, // Optional prop to update categories after creation or update
  setTabName, // Optional prop to set the current tab name
}: CreateUpdateFoodItemProps) => {
  const MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB
  const [imageFiles, setImageFiles] = useState<File[] | null>(null);
  const [imageErrorMessage, setImageErrorMessage] = useState<string>("");
  const [tempImages, setTempImages] = useState<string[]>([]);
  const [pendingImageOperations, setPendingImageOperations] = useState<
    Promise<void>[]
  >([]);
  const [openParentAccordion, setOpenParentAccordion] = useState<string | null>(
    null,
  ); // Parent accordion state
  const [openChildAccordion, setOpenChildAccordion] = useState<string[] | null>(
    null,
  ); // Child accordion state
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const activeRestaurant = useSelector((state: RootState) => state.restaurantsSlice.activeRestaurant);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();

  const form = useForm<z.infer<typeof foodItemSchema>>({
    resolver: zodResolver(foodItemSchema),
    defaultValues: {
      foodName: foodItemDetails?.foodName || "",
      price: foodItemDetails?.price ?? undefined,
      discountedPrice: foodItemDetails?.discountedPrice ?? undefined,
      category: foodItemDetails?.category ?? undefined,
      foodType: foodItemDetails?.foodType || "veg",
      description: foodItemDetails?.description || "",
      tags: foodItemDetails?.tags || [],
      imageUrls: foodItemDetails?.imageUrls || [],
      hasVariants: foodItemDetails?.hasVariants || false,
      variants: foodItemDetails?.variants || [],
    },
  });

  const imageUrls = useWatch({
    control: form.control,
    name: "imageUrls",
  });

  const imageUrlsRef = useRef<string[]>(imageUrls || []);

  useEffect(() => {
    imageUrlsRef.current = imageUrls || [];
  }, [imageUrls]);

  useEffect(() => {
    if (foodItemDetails) {
      form.reset({
        foodName: foodItemDetails.foodName || "",
        price: foodItemDetails.price ?? undefined,
        discountedPrice: foodItemDetails.discountedPrice ?? undefined,
        category: foodItemDetails.category ?? undefined,
        foodType: foodItemDetails.foodType || "veg",
        description: foodItemDetails.description || "",
        tags: foodItemDetails.tags || [],
        imageUrls: tempImages ? imageUrls : foodItemDetails.imageUrls || [],
        hasVariants: foodItemDetails.hasVariants || false,
        variants: foodItemDetails.variants || [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foodItemDetails, form]);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setIsDialogOpen(true);
      if (!isEditing) window.history.pushState(null, "", window.location.href);
    } else {
      if (isEditing) setIsDialogOpen(false);
      else router.back();
    }
  };

  const handleImageRemove = useCallback(
    async (url: string) => {
      if (!imageUrls || imageUrls.length === 0) {
        toast.error("No images to remove");
        return;
      }
      const removePromise = new Promise<void>((resolve, reject) => {
        (async () => {
          setImageErrorMessage("");
          if (!imageUrls.includes(url) && !tempImages.includes(url)) {
            toast.error("Image not found in the list");
            resolve();
            return;
          }
          const tempImageUrls = imageUrls;
          const tempImageFiles = imageFiles;
          try {
            form.setValue(
              "imageUrls",
              imageUrls.filter((u) => u !== url),
              { shouldDirty: true, shouldValidate: true, shouldTouch: true },
            );
            setImageFiles((prev) =>
              prev ? prev.filter((file) => file.name !== url) : null,
            );
            await Promise.all(pendingImageOperations);
            const response = await axios.delete("/media/food-item", {
              data: {
                mediaUrl: url,
                foodItemId:
                  isEditing &&
                  foodItemDetails?.imageUrls?.includes(url) &&
                  foodItemDetails?._id
                    ? foodItemDetails._id
                    : undefined,
              },
            });
            if (!response.data.success) {
              toast.error(response.data.message || "Failed to remove image");
            }
            setTempImages((prev) => prev.filter((img) => img !== url));
            if (isEditing && setFoodItemDetails) {
              setFoodItemDetails((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  imageUrls: prev.imageUrls?.filter((img) => img !== url),
                };
              });
            }
            resolve();
          } catch (error) {
            console.error("Error removing image:", error);
            const axiosError = error as AxiosError<ApiResponse>;
            toast.error(
              axiosError.response?.data.message || "Failed to remove image",
            );
            form.setValue("imageUrls", tempImageUrls);
            setImageFiles(tempImageFiles);
            if (axiosError.response?.status === 401) {
              dispatch(signOut());
              router.push(`/signin?redirect=${pathname}`);
            }
            reject(error);
          }
        })();
      });

      setPendingImageOperations((prev) => [...prev, removePromise]);
    },
    [
      imageUrls,
      tempImages,
      imageFiles,
      form,
      isEditing,
      foodItemDetails,
      dispatch,
      router,
      setFoodItemDetails,
      pendingImageOperations,
      pathname,
    ],
  );

  const handleImageUpload = useCallback(
    async (files: File[]) => {
      const uploadPromise = new Promise<void>((resolve, reject) => {
        (async () => {
          try {
            const formData = new FormData();
            files.forEach((file) => {
              formData.append("foodItemImages", file);
            });
            const response = await axios.post("/media/food-item", formData, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            });
            if (!response.data.success) {
              toast.error(response.data.message || "Failed to upload images");
              reject(new Error("Image upload failed"));
              return;
            }
            imageUrlsRef.current = [
              ...(imageUrlsRef.current || []),
              ...response.data.data,
            ];
            form.setValue(
              "imageUrls",
              [...(imageUrls || []), ...response.data.data],
              {
                shouldDirty: true,
                shouldValidate: true,
                shouldTouch: true,
              },
            );
            setTempImages((prev) => [...prev, ...response.data.data]);
            setImageFiles(null);
            resolve();
          } catch (error) {
            console.error("Error uploading images:", error);
            const axiosError = error as AxiosError<ApiResponse>;
            toast.error(
              axiosError.response?.data.message || "Failed to upload images",
            );
            if (axiosError.response?.status === 401) {
              dispatch(signOut());
              router.push(`/signin?redirect=${pathname}`);
            }
            reject(error);
          }
        })();
      });

      setPendingImageOperations((prev) => [...prev, uploadPromise]);
    },
    [imageUrls, form, dispatch, router, pathname],
  );

  useEffect(() => {
    const handlePopState = () => {
      setIsDialogOpen(false);
      if (tempImages && tempImages.length > 0) {
        tempImages.forEach((url) => handleImageRemove(url));
      }
      form.reset();
      setImageFiles(null);
      setImageErrorMessage("");
      setOpenParentAccordion(null);
      setOpenChildAccordion(null);
    };

    if (isDialogOpen && !isEditing) {
      window.addEventListener("popstate", handlePopState);
    }
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [
    isDialogOpen,
    isEditing,
    tempImages,
    form,
    setImageFiles,
    setImageErrorMessage,
    setOpenParentAccordion,
    setOpenChildAccordion,
    handleImageRemove,
  ]);

  const onSubmit = async (data: z.infer<typeof foodItemSchema>) => {
    if (formLoading) return; // Prevent multiple submissions
    if (!activeRestaurant || activeRestaurant?.userRole !== "owner") {
      toast.error("You do not have permission to edit food items");
      return;
    }

    // Validate if any variant price is undefined or not a number from variants array
    const invalidVariantPrice = data.variants.find(
      (variant) =>
        variant.price === undefined ||
        isNaN(variant.price) ||
        variant.variantName === "",
    );

    if (invalidVariantPrice) {
      const index = data.variants.indexOf(invalidVariantPrice);
      form.setError(`variants.${index}.price`, {
        type: "manual",
        message: "Variant price is required",
      });
      return;
    }

    try {
      setFormLoading(true);
      // Wait for all pending image operations to complete
      await Promise.all(pendingImageOperations);
      // Check if the form values have changed
      if (
        !form.formState.isDirty &&
        Object.keys(form.formState.dirtyFields).length === 0
      ) {
        toast.error(
          "No changes detected. Please update the form before submitting.",
        );

        setFormLoading(false);
        return;
      }

      // Use the ref value for imageUrls
      const updatedData = {
        ...data,
        imageUrls: imageUrlsRef.current,
      };
      const response = isEditing
        ? await axios.patch(
            `/food-item/${restaurantSlug}/${foodItemDetails?._id}`,
            updatedData,
          )
        : await axios.post(`/food-item/${restaurantSlug}`, updatedData);
      if (!response.data.success) {
        toast.error(response.data.message || "Failed to update food item");
        return;
      }
      if (setFoodItemDetails) {
        setFoodItemDetails((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            ...response.data.data,
          };
          // Explicitly set discountedPrice to undefined if not present in response
          if (!("discountedPrice" in response.data.data)) {
            updated.discountedPrice = undefined;
          }
          // Explicitly set category to undefined if not present in response
          if (!("category" in response.data.data)) {
            updated.category = undefined;
          }
          // For variants
          if (
            Array.isArray(prev.variants) &&
            Array.isArray(response.data.data.variants)
          ) {
            updated.variants = prev.variants.map((variant, idx) => {
              const updatedVariant = response.data.data.variants[idx] || {};
              return {
                ...variant,
                ...updatedVariant,
                discountedPrice:
                  "discountedPrice" in updatedVariant
                    ? updatedVariant.discountedPrice
                    : undefined,
              };
            });
          }
          return updated;
        });
      }
      if (setTabName) {
        setTabName("all"); // Reset tab name to "all"
      }
      setAllFoodItems((prev) => {
        if (!prev) return prev; // If allFoodItems is null, return it
        return {
          ...prev,
          foodItems:
            isEditing && prev.foodItems.length > 0
              ? prev.foodItems.map((item) =>
                  item._id === response.data.data._id
                    ? {
                        ...item,
                        ...response.data.data,
                        discountedPrice:
                          "discountedPrice" in response.data.data
                            ? response.data.data.discountedPrice
                            : undefined,
                      }
                    : item,
                )
              : [response.data.data, ...prev.foodItems],
        };
      });
      setTempImages([]);
      form.reset();
      setIsDialogOpen(false);

      toast.success(
        response.data.message ||
          (isEditing
            ? "Food item updated successfully!"
            : "Food item created successfully!"),
      );
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          (isEditing
            ? "An error occurred during food item update"
            : "An error occurred during food item creation"),
      );
      console.error(
        axiosError.response?.data.message ||
          (isEditing
            ? "An error occurred during food item update"
            : "An error occurred during food item creation"),
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push(`/signin?redirect=${pathname}`);
      }
    } finally {
      setFormLoading(false);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (tempImages && tempImages.length > 0) {
        // If there are images, remove them before leaving the page
        tempImages.forEach((url) => handleImageRemove(url));
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrls]);

  useEffect(() => {
    if (!imageErrorMessage) return;

    const timer = setTimeout(() => {
      setImageErrorMessage("");
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [imageErrorMessage]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      {isEditing ? (
        <DialogTrigger className="w-2/4" type="button">
          <Pen />
          Edit
        </DialogTrigger>
      ) : (
        <DialogTrigger type="button">
          <Plus />
          New Item
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <ScrollArea className="max-h-[90vh]">
          <DialogHeader className="p-6">
            <DialogTitle className="mb-4 line-clamp-1 leading-6">
              {isEditing
                ? `Editing: ${foodItemDetails?.foodName}`
                : "Create Food Item"}
            </DialogTitle>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div
                  className={cn(
                    "grid gap-4 transition-all ease-in delay-75",
                    !(imageUrls && imageUrls.length >= 5) ? "mt-4" : "",
                  )}
                >
                  <FoodItemImageUpload
                    imageUrls={imageUrls || []}
                    imageFiles={imageFiles}
                    setImageFiles={setImageFiles}
                    imageErrorMessage={imageErrorMessage}
                    setImageErrorMessage={setImageErrorMessage}
                    handleImageRemove={handleImageRemove}
                    handleImageUpload={handleImageUpload}
                    MAX_IMAGE_SIZE={MAX_IMAGE_SIZE}
                    userRole={activeRestaurant?.userRole}
                    foodItemDetails={foodItemDetails}
                  />

                  <FoodItemBasicInfo
                    form={form}
                    categories={categories}
                    setCategories={setCategories}
                    restaurantSlug={restaurantSlug}
                    foodItemDetails={foodItemDetails}
                    formLoading={formLoading}
                    setFormLoading={setFormLoading}
                  />

                  <FoodItemVariants
                    form={form}
                    openParentAccordion={openParentAccordion}
                    setOpenParentAccordion={setOpenParentAccordion}
                    openChildAccordion={openChildAccordion}
                    setOpenChildAccordion={setOpenChildAccordion}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      formLoading ||
                      (!form.formState.isDirty &&
                        Object.keys(form.formState.dirtyFields).length === 0)
                    }
                  >
                    {formLoading ? (
                      <>
                        <Loader2 className="animate-spin" />
                        {isEditing ? "Updating..." : "Creating..."}
                      </>
                    ) : isEditing ? (
                      "Update Food Item"
                    ) : (
                      "Create Food Item"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogHeader>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUpdateFoodItem;
