import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { ScrollArea, ScrollBar } from "@repo/ui/components/scroll-area";
import type { FoodItemDetails, AllFoodItems } from "@repo/ui/types/FoodItem";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";
import { useForm, useWatch, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { foodItemSchema } from "@/schemas/foodItemSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { Button } from "@repo/ui/components/button";
import {
  Check,
  ChevronsUpDown,
  ImagePlusIcon,
  Loader2,
  Pen,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/popover";
import { cn } from "@repo/ui/lib/utils";
import { TagsInput } from "@repo/ui/components/tags-input";
import { FileRejection, useDropzone } from "react-dropzone";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/store/store";
import axios from "@/utils/axiosInstance";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { ApiResponse } from "@repo/ui/types/ApiResponse";
import { signOut } from "@/store/authSlice";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/accordion";
import CreateRestaurantCategory from "./create-restaurant-category";
import { NonVegIcon, VegIcon } from "./veg-nonveg-tooltip";

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
  setTabName?: React.Dispatch<React.SetStateAction<string>>; // Optional prop to set the current tab name
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
    null
  ); // Parent accordion state
  const [openChildAccordion, setOpenChildAccordion] = useState<string[] | null>(
    null
  ); // Child accordion state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();
  const remoteCategories = foodItemDetails?.restaurantDetails?.categories ?? [];
  const effectiveCategories =
    remoteCategories.length > 0 ? remoteCategories : categories;

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
  const hasVariants = useWatch({
    control: form.control,
    name: "hasVariants",
  });

  const discountedPrice = useWatch({
    control: form.control,
    name: "discountedPrice",
  });

  const variantDiscountedPrices = useWatch({
    control: form.control,
    name: "variants", // This will give you the whole variants array
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants", // Name of the field in the schema
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
      window.history.pushState(null, "", window.location.href);
    } else {
      if (tempImages && tempImages.length > 0) {
        tempImages.forEach((url) => handleImageRemove(url));
      }
      form.reset();
      setImageFiles(null);
      setImageErrorMessage("");
      setOpenParentAccordion(null);
      setOpenChildAccordion(null);
      window.history.back();
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
              imageUrls.filter((u) => u !== url)
            );
            setImageFiles((prev) =>
              prev ? prev.filter((file) => file.name !== url) : null
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
              axiosError.response?.data.message || "Failed to remove image"
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
    ]
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
              }
            );
            setTempImages((prev) => [...prev, ...response.data.data]);
            setImageFiles(null);
            resolve();
          } catch (error) {
            console.error("Error uploading images:", error);
            const axiosError = error as AxiosError<ApiResponse>;
            toast.error(
              axiosError.response?.data.message || "Failed to upload images"
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
    [imageUrls, form, dispatch, router, pathname]
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

    if (isDialogOpen) {
      window.addEventListener("popstate", handlePopState);
    }
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [
    isDialogOpen,
    tempImages,
    form,
    setImageFiles,
    setImageErrorMessage,
    setOpenParentAccordion,
    setOpenChildAccordion,
    handleImageRemove,
  ]);

  const onImageDrop = (
    acceptedFiles: File[],
    rejectedFiles: FileRejection[]
  ) => {
    const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg"];

    if (
      rejectedFiles.length > 0 &&
      rejectedFiles[0]?.errors[0]?.code === "file-too-large"
    ) {
      setImageErrorMessage("One or more files exceed the 1MB size limit");
      return;
    }

    if (!user || user.role !== "owner") {
      toast.error("You do not have permission to upload images");
      return;
    }

    if (
      rejectedFiles.length > 0 ||
      (acceptedFiles.length > 0 &&
        acceptedFiles.some(
          (file) => !file.type || !allowedImageTypes.includes(file.type)
        ))
    ) {
      setImageErrorMessage("Only .jpeg, .jpg, .png files are allowed");
      return;
    }
    if (acceptedFiles.length > 0) {
      if (acceptedFiles.length > 5) {
        setImageErrorMessage("You can only upload up to 5 images");
        return;
      }
      if (acceptedFiles.some((file) => file.size > MAX_IMAGE_SIZE)) {
        setImageErrorMessage("One or more files exceed the 1MB size limit");
        return;
      }
      if (imageUrls && imageUrls.length + acceptedFiles.length > 5) {
        setImageErrorMessage("You can only upload a maximum of 5 images");
        return;
      }
      handleImageUpload(acceptedFiles);
      setImageFiles(acceptedFiles);
      setImageErrorMessage("");
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      accept: {
        "image/jpeg": [],
        "image/png": [],
        "image/jpg": [],
      },
      multiple: true,
      maxFiles: 5,
      maxSize: MAX_IMAGE_SIZE,
      onDrop: onImageDrop,
    });

  const onSubmit = async (data: z.infer<typeof foodItemSchema>) => {
    if (formLoading) return; // Prevent multiple submissions
    if (!user || user.role !== "owner") {
      toast.error("You do not have permission to edit food items");
      return;
    }

    // Validate if any variant price is undefined or not a number from variants array
    const invalidVariantPrice = data.variants.find(
      (variant) =>
        variant.price === undefined ||
        isNaN(variant.price) ||
        variant.variantName === ""
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
          "No changes detected. Please update the form before submitting."
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
            updatedData
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
                    : item
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
            : "Food item created successfully!")
      );
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          (isEditing
            ? "An error occurred during food item update"
            : "An error occurred during food item creation")
      );
      console.error(
        axiosError.response?.data.message ||
          (isEditing
            ? "An error occurred during food item update"
            : "An error occurred during food item creation")
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
    const errors = form.formState.errors;

    if (fields.length === 0 && hasVariants) {
      form.setValue("hasVariants", false);
    }

    if (errors.variants) {
      // Open the parent accordion
      setOpenParentAccordion("variants");

      // Open the first child accordion with errors
      let firstErrorIndex = -1;
      if (Array.isArray(errors.variants)) {
        firstErrorIndex = errors.variants.findIndex(
          (error) => error !== undefined
        );
      }
      if (firstErrorIndex !== -1) {
        setOpenChildAccordion((prev) => [
          ...(prev || []),
          `item-${firstErrorIndex}`,
        ]);
      }
    }
  }, [form.formState.errors, fields, form, hasVariants]);

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
          New Food Item
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
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
                    !(imageUrls && imageUrls.length >= 5) ? "mt-4" : ""
                  )}
                >
                  <div
                    {...getRootProps()}
                    className={`group aspect-square rounded-xl mx-auto text-center cursor-pointer hover:bg-secondary/70 bg-secondary flex items-center justify-center ${imageUrls && imageUrls.length >= 5 ? "hidden" : ""} ${
                      isDragActive
                        ? `${!isDragReject ? "border-green-500" : "border-red-500"} border-2`
                        : isDragReject
                          ? "border-red-500 border-2"
                          : "border-zinc-500 border-dashed border"
                    }`}
                  >
                    <input {...getInputProps()} name="logoUrl" />
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-xl w-full h-full"
                    >
                      <ImagePlusIcon />
                      Select Images
                    </Button>
                  </div>
                  {imageErrorMessage && (
                    <p className="text-red-500 mb-2">{imageErrorMessage}</p>
                  )}

                  {((imageFiles && imageFiles.length > 0) ||
                    (imageUrls && imageUrls.length > 0)) && (
                    <ScrollArea
                      viewportClassName="h-24 flex items-center"
                      className="pt-2 pb-2 w-[85vw] sm:max-w-[400px] rounded-md border whitespace-nowrap border-none"
                    >
                      <div className="group relative w-full rounded-full h-20">
                        <div className="flex gap-2">
                          {imageFiles && imageFiles.length > 0 ? (
                            <>
                              {imageUrls &&
                                imageUrls.length > 0 &&
                                imageUrls.map((url, index) => (
                                  <div
                                    key={index}
                                    className="aspect-square w-20 relative"
                                  >
                                    <Image
                                      src={url}
                                      fill
                                      alt={`Food Item Image ${index + 1}`}
                                      className="rounded-xl object-cover static"
                                    />
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          type="button"
                                          className="absolute top-0 right-0 -translate-y-1/3 text-red-500 rounded-full p-1! h-min bg-muted hover:bg-muted/90 hover:text-red-600 cursor-pointer"
                                        >
                                          <Trash2 className="w-4 h-4 p-0" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Are you absolutely sure?
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This action cannot be undone. This
                                            will permanently delete this image
                                            from the server. Even if you
                                            don&apos;t submit this form.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            className="bg-red-500 hover:bg-red-600 text-white"
                                            onClick={() =>
                                              handleImageRemove(url)
                                            }
                                          >
                                            Continue
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                ))}
                              {imageFiles.map((file, index) => (
                                <div
                                  key={index}
                                  className="aspect-square w-20 relative"
                                >
                                  <Image
                                    src={URL.createObjectURL(file)}
                                    fill
                                    alt={`Food Item Image ${index + 1}`}
                                    className="rounded-xl object-cover static"
                                  />
                                  <div className="absolute bg-muted/70 inset-0 flex items-center justify-center z-20 rounded-xl">
                                    <Loader2 className="animate-spin w-6 h-6 text-primary" />
                                  </div>
                                </div>
                              ))}
                            </>
                          ) : (
                            imageUrls &&
                            imageUrls.length > 0 &&
                            imageUrls.map((url, index) => (
                              <div
                                key={index}
                                className="aspect-square w-20 relative"
                              >
                                <Image
                                  src={url}
                                  fill
                                  alt={`Food Item Image ${index + 1}`}
                                  className="rounded-xl object-cover static"
                                />
                                {foodItemDetails?.imageUrls?.includes(url) ? (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        type="button"
                                        className="absolute top-0 right-0 -translate-y-1/3 text-red-500 rounded-full p-1! h-min bg-muted hover:bg-muted/90 hover:text-red-600 cursor-pointer"
                                      >
                                        <Trash2 className="w-4 h-4 p-0" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Are you absolutely sure?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This action cannot be undone. This
                                          will permanently delete this image
                                          from the server. Even if you
                                          don&apos;t submit this form.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          className="bg-red-500 hover:bg-red-600 text-white"
                                          onClick={() => handleImageRemove(url)}
                                        >
                                          Continue
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                ) : (
                                  <Button
                                    type="button"
                                    className="absolute top-0 right-0 -translate-y-1/3 text-red-500 rounded-full p-1! h-min bg-muted hover:bg-muted/90 hover:text-red-600 cursor-pointer"
                                    onClick={() => handleImageRemove(url)}
                                  >
                                    <Trash2 className="w-4 h-4 p-0" />
                                  </Button>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  )}
                  <FormField
                    control={form.control}
                    name="foodName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="foodName">Food Name</FormLabel>
                        <FormControl>
                          <Input
                            id="foodName"
                            type="text"
                            placeholder="E.g., Pizza"
                            autoComplete="off"
                            required
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                        <FormDescription>
                          Name of the food item.
                          <span className="text-muted-foreground block">
                            Note: every food name must be unique.
                          </span>
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="price">Price</FormLabel>
                        <FormControl>
                          <Input
                            id="price"
                            type="number"
                            inputMode="numeric"
                            placeholder="E.g., 100"
                            autoComplete="off"
                            {...field}
                            value={field.value === undefined ? "" : field.value} // Convert undefined to an empty string
                            onChange={(e) =>
                              field.onChange(e.target.valueAsNumber)
                            }
                            onWheel={(e) => {
                              (e.target as HTMLInputElement).blur();
                            }}
                            step={"0"}
                          />
                        </FormControl>
                        <FormMessage />
                        <FormDescription>
                          The original price of the food item. Must be a
                          positive number.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discountedPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="discountedPrice">
                          Discounted Price
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="discountedPrice"
                            type="number"
                            inputMode="numeric"
                            placeholder="E.g., 80"
                            autoComplete="off"
                            {...field}
                            value={
                              discountedPrice === undefined
                                ? ""
                                : discountedPrice
                            } // Convert undefined to an empty string
                            onChange={(e) => {
                              const value = e.target.value;
                              const number =
                                value === "" ? undefined : Number(value); // Convert empty string to undefined
                              form.setValue("discountedPrice", number, {
                                shouldDirty: true,
                                shouldValidate: true,
                                shouldTouch: true,
                              });
                            }}
                            onWheel={(e) => {
                              (e.target as HTMLInputElement).blur();
                            }}
                            step={"0"}
                          />
                        </FormControl>
                        <FormMessage />
                        <FormDescription>
                          Optional discounted price for the food item. Must be a
                          positive number.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="foodType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="foodType">Food Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="text-sm font-medium w-[180px] border-muted-foreground/70">
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="veg">
                              <VegIcon className="ml-1"/>
                              Veg
                            </SelectItem>
                            <SelectItem value="non-veg">
                              <NonVegIcon className="ml-1"/>
                              Non Veg
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        <FormDescription>
                          Type of food (e.g., &quot;veg&quot; or &quot;non
                          veg&quot;).
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="category">Category</FormLabel>
                        <FormControl>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-[200px] justify-between",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value
                                    ? categories.length > 0
                                      ? categories.find(
                                          (category) => category === field.value
                                        )
                                      : foodItemDetails?.restaurantDetails.categories.find(
                                          (category) => category === field.value
                                        )
                                    : "Select category"}
                                  <ChevronsUpDown className="opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0">
                              <Command>
                                <CommandInput
                                  placeholder="Search category..."
                                  className="h-9"
                                />
                                <CommandList>
                                  <CommandEmpty>
                                    No category found.
                                  </CommandEmpty>
                                  <div className="p-1 pb-0 w-full space-y-1">
                                    <CreateRestaurantCategory
                                      isLoading={formLoading}
                                      setIsLoading={setFormLoading}
                                      restaurantSlug={restaurantSlug}
                                      setCategories={setCategories}
                                      categories={categories}
                                    />
                                    <Button
                                      variant="ghost"
                                      className="w-full text-sm font-normal h-min py-1.5 px-2! hover:bg-accent!"
                                      onClick={() => {
                                        form.setValue("category", undefined);
                                      }}
                                    >
                                      No category
                                      <Check
                                        className={cn(
                                          "ml-auto",
                                          undefined === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                    </Button>
                                  </div>
                                  <CommandGroup>
                                    {effectiveCategories.length > 0 ? (
                                      effectiveCategories.map((category) => (
                                        <CommandItem
                                          key={category}
                                          value={category}
                                          className="cursor-pointer"
                                          onSelect={() =>
                                            form.setValue("category", category)
                                          }
                                        >
                                          {category}
                                          <Check
                                            className={cn(
                                              "ml-auto",
                                              category === field.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                        </CommandItem>
                                      ))
                                    ) : (
                                      <CommandItem disabled>
                                        No category available
                                      </CommandItem>
                                    )}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </FormControl>
                        <FormMessage />
                        <FormDescription>
                          Optional category for the food item.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="description">Description</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Textarea
                              id="description"
                              placeholder="E.g., Cheese pizza with fresh toppings"
                              autoComplete="off"
                              className="resize-none pb-4 whitespace-pre-wrap"
                              {...field}
                            />
                          </FormControl>
                          <span className="absolute bottom-[1px] right-1 text-xs">
                            {field?.value?.length || 0}/200
                          </span>
                        </div>
                        <FormMessage />
                        <FormDescription>
                          Optional description for the food item.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="tags">Tags</FormLabel>
                        <FormControl>
                          <TagsInput
                            id="tags"
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder={
                              field.value && field.value?.length > 0
                                ? "Add another tag"
                                : "E.g., spicy, smoky, cheesy"
                            }
                            className="resize-none pb-4 whitespace-pre-wrap break-all focus-within:border-input focus-within:ring-1"
                          />
                        </FormControl>
                        <FormMessage />
                        <FormDescription>
                          Optional description for the food item. After adding a
                          tag, press Enter to add another tag.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  {hasVariants && (
                    <Accordion
                      type="single"
                      collapsible
                      className="w-full"
                      value={openParentAccordion || ""}
                      onValueChange={(value) => setOpenParentAccordion(value)}
                    >
                      <AccordionItem value="variants">
                        <AccordionTrigger className="cursor-pointer">
                          See Variants
                        </AccordionTrigger>
                        <AccordionContent>
                          {fields.length > 0 ? (
                            fields.map((field, index) => {
                              const discountedPrice =
                                variantDiscountedPrices?.[index]
                                  ?.discountedPrice ?? undefined;

                              return (
                                <Accordion
                                  type="multiple"
                                  className="w-full"
                                  value={openChildAccordion || [""]}
                                  onValueChange={(value) =>
                                    setOpenChildAccordion(value)
                                  }
                                  key={field.id}
                                >
                                  <AccordionItem
                                    key={field.id}
                                    value={`item-${index}`}
                                  >
                                    <AccordionTrigger className="cursor-pointer">
                                      {field.variantName || "New Variant"}
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <div className="border pt-6 p-4 rounded-md space-y-3 relative">
                                        <FormField
                                          control={form.control}
                                          name={`variants.${index}.variantName`}
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel
                                                htmlFor={`variantName-${index}`}
                                              >
                                                Variant Name
                                              </FormLabel>
                                              <FormControl>
                                                <Input
                                                  id={`variantName-${index}`}
                                                  placeholder="E.g., Large"
                                                  autoComplete="off"
                                                  {...field}
                                                />
                                              </FormControl>
                                              <FormMessage />
                                              <FormDescription>
                                                Name of the variant (e.g.,
                                                Large, Medium, Small).
                                              </FormDescription>
                                            </FormItem>
                                          )}
                                        />
                                        <FormField
                                          control={form.control}
                                          name={`variants.${index}.price`}
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel
                                                htmlFor={`price-${index}`}
                                              >
                                                Price
                                              </FormLabel>
                                              <FormControl>
                                                <Input
                                                  id={`price-${index}`}
                                                  type="number"
                                                  inputMode="numeric"
                                                  autoComplete="off"
                                                  placeholder="E.g., 100"
                                                  {...field}
                                                  value={
                                                    field.value === undefined
                                                      ? ""
                                                      : field.value
                                                  } // Convert undefined to an empty string
                                                  onChange={(e) =>
                                                    field.onChange(
                                                      e.target.valueAsNumber
                                                    )
                                                  }
                                                  onWheel={(e) => {
                                                    (
                                                      e.target as HTMLInputElement
                                                    ).blur();
                                                  }}
                                                  step={"0"}
                                                />
                                              </FormControl>
                                              <FormMessage />
                                              <FormDescription>
                                                Price for this variant. Must be
                                                a positive number.
                                              </FormDescription>
                                            </FormItem>
                                          )}
                                        />
                                        <FormField
                                          control={form.control}
                                          name={`variants.${index}.discountedPrice`}
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel
                                                htmlFor={`discountedPrice-${index}`}
                                              >
                                                Discounted Price
                                              </FormLabel>
                                              <FormControl>
                                                <Input
                                                  id={`discountedPrice-${index}`}
                                                  type="number"
                                                  autoComplete="off"
                                                  inputMode="numeric"
                                                  placeholder="E.g., 80"
                                                  {...field}
                                                  value={
                                                    discountedPrice ===
                                                    undefined
                                                      ? ""
                                                      : discountedPrice
                                                  }
                                                  onChange={(e) => {
                                                    const value =
                                                      e.target.value;
                                                    const number =
                                                      value === ""
                                                        ? undefined
                                                        : Number(value); // Convert empty string to undefined

                                                    form.setValue(
                                                      `variants.${index}.discountedPrice`,
                                                      number,
                                                      {
                                                        shouldDirty: true,
                                                        shouldValidate: true,
                                                        shouldTouch: true,
                                                      }
                                                    ); // Explicitly update the form state
                                                  }}
                                                  onWheel={(e) => {
                                                    (
                                                      e.target as HTMLInputElement
                                                    ).blur();
                                                  }}
                                                  step={"0"}
                                                />
                                              </FormControl>
                                              <FormMessage />
                                              <FormDescription>
                                                Optional discounted price for
                                                this variant.
                                              </FormDescription>
                                            </FormItem>
                                          )}
                                        />
                                        <FormField
                                          control={form.control}
                                          name={`variants.${index}.description`}
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel
                                                htmlFor={`description-${index}`}
                                              >
                                                Description
                                              </FormLabel>
                                              <div className="relative">
                                                <FormControl>
                                                  <Textarea
                                                    id={`description-${index}`}
                                                    placeholder="E.g., Spicy variant"
                                                    autoComplete="off"
                                                    className="resize-none pb-4 whitespace-pre-wrap"
                                                    {...field}
                                                  />
                                                </FormControl>
                                                <span className="absolute bottom-[1px] right-1 text-xs">
                                                  {field?.value?.length || 0}
                                                  /100
                                                </span>
                                              </div>
                                              <FormMessage />
                                              <FormDescription>
                                                Optional description for this
                                                variant.
                                              </FormDescription>
                                            </FormItem>
                                          )}
                                        />
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          className="mt-2 absolute top-0 right-2 p-2! h-min"
                                          onClick={() => {
                                            remove(index);
                                          }}
                                        >
                                          <Trash2 className="size-4" />
                                          <span className="sr-only">
                                            Remove Variant
                                          </span>
                                        </Button>
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              );
                            })
                          ) : (
                            <p>No variants available.</p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      className=""
                      onClick={() => {
                        form.setValue("hasVariants", true);
                        append({
                          variantName: "",
                          price: undefined,
                          discountedPrice: undefined,
                          description: "",
                        });
                        // Open the parent accordion
                        setOpenParentAccordion("variants");

                        // Open the newly added child accordion
                        setOpenChildAccordion((prev) => [
                          ...(prev || []),
                          `item-${fields.length}`,
                        ]);
                      }}
                    >
                      <Plus />{" "}
                      {fields.length > 0
                        ? "Add Another Variant"
                        : "Add Variant"}
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={formLoading}
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
