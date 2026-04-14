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
  setTabName, // Optional prop to set the current tab name
}: CreateUpdateFoodItemProps) => {
  const MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB
  const [imageFiles, setImageFiles] = useState<File[] | null>(null);
  const [imageErrorMessage, setImageErrorMessage] = useState<string>("");
  const [tempImages, setTempImages] = useState<string[]>([]);
  const [openParentAccordion, setOpenParentAccordion] = useState<string | null>(
    null,
  ); // Parent accordion state
  const [openChildAccordion, setOpenChildAccordion] = useState<string[] | null>(
    null,
  ); // Child accordion state
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const activeRestaurant = useSelector(
    (state: RootState) => state.restaurantsSlice.activeRestaurant,
  );
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
  const tempImagesRef = useRef<string[]>([]);
  const pendingImageOperationsRef = useRef<Set<Promise<void>>>(new Set());
  const isDialogCleanupInProgressRef = useRef(false);

  const trackImageOperation = useCallback((operation: Promise<void>) => {
    pendingImageOperationsRef.current.add(operation);
    operation.finally(() => {
      pendingImageOperationsRef.current.delete(operation);
    });
    return operation;
  }, []);

  const waitForPendingImageOperations = useCallback(async () => {
    const pendingOperations = Array.from(pendingImageOperationsRef.current);
    if (pendingOperations.length === 0) {
      return;
    }

    await Promise.allSettled(pendingOperations);
  }, []);

  const getCurrentDialogParam = useCallback(() => {
    return isEditing ? "edit" : "create";
  }, [isEditing]);

  const isDialogLayerActive = useCallback(() => {
    const url = new URL(window.location.href);
    const dialogParam = getCurrentDialogParam();
    const isDialogOpenInUrl = url.searchParams.get(dialogParam) === "true";

    if (!isDialogOpenInUrl) {
      return false;
    }

    if (!isEditing || !foodItemDetails?._id) {
      return isDialogOpenInUrl;
    }

    return url.searchParams.get("food") === foodItemDetails._id;
  }, [foodItemDetails?._id, getCurrentDialogParam, isEditing]);

  const resetDialogState = useCallback(() => {
    form.reset({
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
    });
    imageUrlsRef.current = foodItemDetails?.imageUrls || [];
    setImageFiles(null);
    setImageErrorMessage("");
    setOpenParentAccordion(null);
    setOpenChildAccordion(null);
  }, [foodItemDetails, form]);

  useEffect(() => {
    imageUrlsRef.current = imageUrls || [];
  }, [imageUrls]);

  useEffect(() => {
    tempImagesRef.current = tempImages;
  }, [tempImages]);

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
        imageUrls:
          tempImagesRef.current.length > 0
            ? imageUrlsRef.current
            : foodItemDetails.imageUrls || [],
        hasVariants: foodItemDetails.hasVariants || false,
        variants: foodItemDetails.variants || [],
      });
    }
  }, [foodItemDetails, form]);

  const cleanupTempImages = useCallback(async () => {
    await waitForPendingImageOperations();

    const imagesToRemove = Array.from(new Set(tempImagesRef.current));
    if (imagesToRemove.length === 0) {
      return;
    }

    await Promise.allSettled(
      imagesToRemove.map(async (url) => {
        await axios.delete("/media/food-item", {
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
      }),
    );

    setTempImages([]);
    tempImagesRef.current = [];
  }, [foodItemDetails, isEditing, waitForPendingImageOperations]);

  const closeDialogAndCleanup = useCallback(async () => {
    if (isDialogCleanupInProgressRef.current) {
      return;
    }

    isDialogCleanupInProgressRef.current = true;
    setIsDialogOpen(false);
    await cleanupTempImages();
    resetDialogState();
    isDialogCleanupInProgressRef.current = false;
  }, [cleanupTempImages, resetDialogState]);

  const closeDialogWithHistory = useCallback(() => {
    if (!isDialogLayerActive()) {
      void closeDialogAndCleanup();
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.delete(getCurrentDialogParam());
    window.history.replaceState(window.history.state, "", url.toString());
    void closeDialogAndCleanup();
  }, [closeDialogAndCleanup, getCurrentDialogParam, isDialogLayerActive]);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setIsDialogOpen(true);

      if (isDialogLayerActive()) {
        return;
      }

      const url = new URL(window.location.href);
      const dialogParam = getCurrentDialogParam();
      url.searchParams.set(dialogParam, "true");

      if (isEditing && foodItemDetails?._id) {
        url.searchParams.set("food", foodItemDetails._id);
      }

      window.history.pushState(
        {
          overlay: isEditing ? "food-edit-dialog" : "food-create-dialog",
          food: foodItemDetails?._id,
        },
        "",
        url.toString(),
      );
      return;
    }

    closeDialogWithHistory();
  };

  const handleImageRemove = useCallback(
    async (url: string) => {
      if (!imageUrls || imageUrls.length === 0) {
        toast.error("No images to remove");
        return;
      }
      setImageErrorMessage("");

      if (!imageUrls.includes(url) && !tempImagesRef.current.includes(url)) {
        toast.error("Image not found in the list");
        return;
      }

      const previousImageUrls = imageUrls;
      const previousImageFiles = imageFiles;

      form.setValue(
        "imageUrls",
        imageUrls.filter((u) => u !== url),
        { shouldDirty: true, shouldValidate: true, shouldTouch: true },
      );
      setImageFiles((prev) =>
        prev ? prev.filter((file) => file.name !== url) : null,
      );

      const removeOperation = (async () => {
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
          throw new Error(response.data.message || "Failed to remove image");
        }

        imageUrlsRef.current = imageUrlsRef.current.filter(
          (img) => img !== url,
        );
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
      })();

      try {
        await trackImageOperation(removeOperation);
      } catch (error) {
        console.error("Error removing image:", error);
        const axiosError = error as AxiosError<ApiResponse>;
        toast.error(
          axiosError.response?.data.message || "Failed to remove image",
        );
        form.setValue("imageUrls", previousImageUrls, {
          shouldDirty: true,
          shouldValidate: true,
          shouldTouch: true,
        });
        imageUrlsRef.current = previousImageUrls;
        setImageFiles(previousImageFiles);
        if (axiosError.response?.status === 401) {
          dispatch(signOut());
          router.push(`/signin?redirect=${pathname}`);
        }
      }
    },
    [
      imageUrls,
      imageFiles,
      form,
      isEditing,
      foodItemDetails,
      dispatch,
      router,
      setFoodItemDetails,
      trackImageOperation,
      pathname,
    ],
  );

  const handleImageUpload = useCallback(
    async (files: File[]) => {
      const uploadOperation = (async () => {
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
          throw new Error(response.data.message || "Failed to upload images");
        }

        const nextImageUrls = [
          ...(imageUrlsRef.current || []),
          ...response.data.data,
        ];
        imageUrlsRef.current = nextImageUrls;

        form.setValue("imageUrls", nextImageUrls, {
          shouldDirty: true,
          shouldValidate: true,
          shouldTouch: true,
        });

        setTempImages((prev) => [...prev, ...response.data.data]);
        setImageFiles(null);
      })();

      try {
        await trackImageOperation(uploadOperation);
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
      }
    },
    [dispatch, form, pathname, router, trackImageOperation],
  );

  useEffect(() => {
    const syncFromHistory = () => {
      const shouldBeOpen = isDialogLayerActive();

      if (shouldBeOpen) {
        if (!isDialogOpen) {
          setIsDialogOpen(true);
        }
        return;
      }

      if (isDialogOpen) {
        void closeDialogAndCleanup();
      }
    };

    syncFromHistory();
    window.addEventListener("popstate", syncFromHistory);
    return () => {
      window.removeEventListener("popstate", syncFromHistory);
    };
  }, [closeDialogAndCleanup, isDialogLayerActive, isDialogOpen]);

  const onSubmit = async (data: z.infer<typeof foodItemSchema>) => {
    if (formLoading) return; // Prevent multiple submissions
    if (!activeRestaurant || activeRestaurant?.userRole !== "owner") {
      toast.error("You do not have permission to edit food items");
      return;
    }

    // Validate if any variant price is undefined or not a number from variants array
    if (data.variants && data.variants.length > 0) {
      const invalidVariantPrice = data.variants.find(
        (variant) => variant.price === undefined || isNaN(variant.price),
      );

      if (invalidVariantPrice) {
        const index = data.variants.indexOf(invalidVariantPrice);
        form.setError(`variants.${index}.price`, {
          type: "manual",
          message: "Variant price is required",
        });
        setOpenParentAccordion("variants");
        setOpenChildAccordion((prev) => [...(prev || []), `item-${index}`]);
        toast.error("Please provide a valid price for each variant.");
        return;
      }

      const invalidVariantName = data.variants.find(
        (variant) => variant.variantName.trim() === "",
      );

      if (invalidVariantName) {
        const index = data.variants.indexOf(invalidVariantName);
        form.setError(`variants.${index}.variantName`, {
          type: "manual",
          message: "Variant name is required",
        });
        setOpenParentAccordion("variants");
        setOpenChildAccordion((prev) => [...(prev || []), `item-${index}`]);
        toast.error("Please provide a name for each variant.");
        return;
      }
    }

    try {
      setFormLoading(true);
      // Wait for all pending image operations to complete
      await waitForPendingImageOperations();
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
      tempImagesRef.current = [];
      resetDialogState();

      if (isDialogLayerActive() && window.history.length > 1) {
        window.history.back();
      } else {
        setIsDialogOpen(false);
      }

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
      const imagesToRemove = Array.from(new Set(tempImagesRef.current));
      if (imagesToRemove.length === 0) {
        return;
      }

      imagesToRemove.forEach((url) => {
        void axios.delete("/media/food-item", {
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
      });
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [foodItemDetails, isEditing]);

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
              <form
                onSubmit={form.handleSubmit(onSubmit, () => {
                  setOpenParentAccordion("variants");
                  toast.error("Please fix form errors before submitting.");
                })}
              >
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
