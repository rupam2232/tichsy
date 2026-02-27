"use client";
import axios from "@/utils/axiosInstance";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { signOut } from "@/store/authSlice";
import { updateRestaurant, setActiveRestaurant } from "@/store/restaurantSlice";
import type { AxiosError } from "axios";
import type { ApiResponse, RestaurantFullInfo } from "@repo/types";
import { ImagePlusIcon, Loader2, Trash2 } from "lucide-react";
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
import type { AppDispatch } from "@/store/store";
import { Avatar, AvatarImage } from "@repo/ui/components/avatar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateRestaurantSchema } from "@repo/types";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { TagsInput } from "@repo/ui/components/tags-input";
import { FileRejection, useDropzone } from "react-dropzone";
import { useDebounceCallback } from "usehooks-ts";
import { Switch } from "@repo/ui/components/switch";

const ClientPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
  const [restaurantData, setRestaurantData] = useState<RestaurantFullInfo>();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageErrorMessage, setImageErrorMessage] = useState<string>("");
  const [pendingImageOperations, setPendingImageOperations] = useState<
    Promise<void>[]
  >([]);
  const [formSlug, setFormSlug] = useState<string>("");
  const [isSlugUnique, setIsSlugUnique] = useState<boolean | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState<boolean>(false);
  const debounced = useDebounceCallback(setFormSlug, 300);

  const form = useForm<z.infer<typeof updateRestaurantSchema>>({
    resolver: zodResolver(updateRestaurantSchema),
    mode: "all",
    defaultValues: {
      restaurantName: "",
      newSlug: "",
      description: "",
      categories: [],
      address: "",
      openingTime: "",
      closingTime: "",
      logoUrl: undefined,
    },
  });

  const isReallyDirty = useCallback(() => {
    const current = form.getValues();
    // Compare trimmed strings, and arrays as needed
    return (
      form.formState.defaultValues?.restaurantName?.trim() !==
        current.restaurantName.trim() ||
      form.formState.defaultValues?.logoUrl !== current.logoUrl?.trim() ||
      form.formState.defaultValues?.newSlug?.trim() !==
        current.newSlug.trim() ||
      (form.formState.defaultValues?.description?.trim() || "") !==
        (current.description?.trim() || "") ||
      form.formState.defaultValues?.address?.trim() !==
        current.address?.trim() ||
      form.formState.defaultValues?.openingTime?.trim() !==
        current.openingTime?.trim() ||
      form.formState.defaultValues?.closingTime?.trim() !==
        current.closingTime?.trim() ||
      // Compare arrays (categories)
      JSON.stringify(form.formState.defaultValues?.categories) !==
        JSON.stringify(current.categories) ||
      form.formState.defaultValues?.logoUrl !== current.logoUrl
    );
  }, [form]);

  const logoUrl = useWatch({
    control: form.control,
    name: "logoUrl",
  });

  const checkUsernameUnique = useCallback(async () => {
    setIsSlugUnique(null);
    if (isCheckingSlug) return; // Prevent multiple requests
    if (!formSlug) return; // Skip if slug is empty
    if (formSlug === restaurantData?.slug) return;
    form.trigger("newSlug"); // Ensure slug is validated before checking uniqueness
    if (form.getValues("newSlug").length > 2) {
      setIsCheckingSlug(true);
      setIsSlugUnique(null);
      try {
        const response = await axios.get(
          `/restaurant/${formSlug}/is-unique-slug`,
        );
        if (!response.data.data) {
          form.setError("newSlug", {
            type: "validate",
            message: "Slug is already taken",
          });
        } else {
          setIsSlugUnique(true);
        }
      } catch (error) {
        const axiosError = error as AxiosError<ApiResponse>;
        console.error("Error checking slug uniqueness:", axiosError);
        if (axiosError.response?.status === 401) {
          dispatch(signOut());
          router.push("/signin");
        }
      } finally {
        setIsCheckingSlug(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formSlug]);

  useEffect(() => {
    checkUsernameUnique();
  }, [checkUsernameUnique]);

  const handleImageRemove = useCallback(async () => {
    const uploadPromise = new Promise<void>((resolve, reject) => {
      (async () => {
        setImageErrorMessage("");
        // If logoUrl is set, remove the image from the server
        await Promise.all(pendingImageOperations);
        if (logoUrl) {
          const mediaUrl = logoUrl;
          try {
            form.setValue("logoUrl", undefined, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });
            setImageFile(null);
            const response = await axios.delete("/media/restaurant-logo", {
              data: {
                mediaUrl,
                restaurantId:
                  restaurantData?.logoUrl === mediaUrl
                    ? restaurantData?._id
                    : undefined,
              },
            });
            if (!response.data.success) {
              toast.error(response.data.message || "Failed to remove logo");
            } else {
              if (restaurantData?.logoUrl === mediaUrl) {
                setRestaurantData((prev) =>
                  prev ? { ...prev, logoUrl: undefined } : prev,
                );
                dispatch(
                  setActiveRestaurant({
                    ...restaurantData,
                    logoUrl: undefined,
                  }),
                );
              }
            }
            resolve();
          } catch (error) {
            console.error("Error removing image:", error);
            form.setValue("logoUrl", mediaUrl, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });
            const axiosError = error as AxiosError<ApiResponse>;
            toast.error(
              axiosError.response?.data.message || "Failed to remove logo",
            );
            if (axiosError.response?.status === 401) {
              dispatch(signOut());
              router.push("/signin?redirect=/restaurant/" + slug + "/settings");
            }
            reject(error);
          }
        }
      })();
    });
    setPendingImageOperations((prev) => [...prev, uploadPromise]);
  }, [
    pendingImageOperations,
    router,
    dispatch,
    slug,
    form,
    logoUrl,
    restaurantData,
  ]);

  const handleImageUpload = useCallback(
    async (file: File) => {
      const uploadPromise = new Promise<void>((resolve, reject) => {
        (async () => {
          try {
            await Promise.all(pendingImageOperations);
            const response = await axios.post(
              "/media/restaurant-logo",
              { restaurantLogo: file },
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              },
            );
            form.setValue("logoUrl", response.data.data, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });
            resolve();
          } catch (error) {
            console.error("Error uploading image:", error);
            const axiosError = error as AxiosError<ApiResponse>;
            toast.error(
              axiosError.response?.data.message || "Failed to upload image",
            );
            if (axiosError.response?.status === 401) {
              dispatch(signOut());
              router.push("/signin?redirect=/restaurant/" + slug + "/settings");
            }
            reject(error);
          }
        })();
      });
      setPendingImageOperations((prev) => [...prev, uploadPromise]);
    },
    [pendingImageOperations, router, dispatch, slug, form],
  );

  const onImageDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg"];

      if (rejectedFiles.length > 0) {
        if (rejectedFiles[0]?.errors[0]?.code === "file-too-large") {
          setImageErrorMessage("Logo file size exceeds 1MB.");
          return;
        } else if (rejectedFiles[0]?.errors[0]?.code === "file-invalid-type") {
          setImageErrorMessage("Only .jpeg, .jpg, .png files are allowed.");
          return;
        } else {
          setImageErrorMessage(
            rejectedFiles[0]?.errors[0]?.message ||
              "Failed to upload logo. Please try again.",
          );
          return;
        }
      }
      if (
        acceptedFiles.length > 0 &&
        (!acceptedFiles[0]?.type ||
          !allowedImageTypes.includes(acceptedFiles[0].type))
      ) {
        setImageErrorMessage("Only .jpeg, .jpg, .png files are allowed.");
        return;
      }
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0] as File;
        if (file.size > MAX_IMAGE_SIZE) {
          setImageErrorMessage("Logo file size exceeds 1MB.");
          return;
        }
        handleImageUpload(file);
        setImageFile(file);
        setImageErrorMessage("");
      }
    },
    [handleImageUpload, MAX_IMAGE_SIZE],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      accept: {
        "image/jpeg": [],
        "image/png": [],
        "image/jpg": [],
      },
      multiple: false,
      maxSize: MAX_IMAGE_SIZE,
      onDrop: onImageDrop,
    });

  const fetchRestaurantData = useCallback(async () => {
    try {
      setIsPageLoading(true);
      const response = await axios.get(`/restaurant/${slug}`);

      if (response.data.success) {
        setRestaurantData(response.data.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(
        "Failed to fetch restaurant data. Please try again later:",
        error,
      );
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Failed to fetch restaurant data. Please try again later",
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push("/signin?redirect=/restaurant/" + slug + "/settings");
      }
    } finally {
      setIsPageLoading(false);
    }
  }, [slug, router, dispatch]);

  const toggleArchiveStatus = useCallback(async () => {
    if (!restaurantData) return;
    const isArchived = restaurantData.isArchived;

    // Optimistic update
    setRestaurantData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        isArchived: !isArchived,
      };
    });

    try {
      const response = await axios.patch(
        `/restaurant/${slug}/toggle-archive-status`,
      );

      if (response.data.success) {
        toast.success(
          response.data.message ||
            `Restaurant ${!isArchived ? "archived" : "unarchived"} successfully`,
        );
        setRestaurantData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            isArchived: response.data.data.isArchived,
          };
        });
        dispatch(updateRestaurant(response.data.data));
        dispatch(setActiveRestaurant(response.data.data));
      } else {
        // Revert on failure
        setRestaurantData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            isArchived: isArchived,
          };
        });
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Failed to toggle archive status:", error);
      // Revert on error
      setRestaurantData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          isArchived: isArchived,
        };
      });
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message || "Failed to toggle archive status",
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push("/signin?redirect=/restaurant/" + slug + "/settings");
      }
    }
  }, [slug, router, dispatch, restaurantData]);

  const onSubmit = useCallback(
    async (data: z.infer<typeof updateRestaurantSchema>) => {
      await Promise.all(pendingImageOperations);
      const toastId = toast.loading("Updating restaurant...");
      if (isReallyDirty() === false) {
        toast.info("No changes made", { id: toastId });
        return;
      }
      try {
        const response = await axios.patch(`/restaurant/${slug}`, data);

        if (response.data.success) {
          toast.success(
            response.data.message || "Restaurant updated successfully",
            {
              id: toastId,
            },
          );

          setRestaurantData(response.data.data);
          dispatch(updateRestaurant(response.data.data));
          dispatch(setActiveRestaurant(response.data.data));

          if (response.data.data.slug !== slug) {
            localStorage.setItem(
              `slug_redirect_${slug}`,
              response.data.data.slug,
            );
            localStorage.removeItem(`slug_redirect_${response.data.data.slug}`);
            router.replace(`/restaurant/${response.data.data.slug}/settings`);
            return;
          }
        } else {
          toast.error(response.data.message, {
            id: toastId,
          });
        }
      } catch (error) {
        console.error(
          "Failed to update restaurant data. Please try again later:",
          error,
        );
        const axiosError = error as AxiosError<ApiResponse>;
        toast.error(
          axiosError.response?.data.message ||
            "Failed to update restaurant data. Please try again later",
          {
            id: toastId,
          },
        );
        if (axiosError.response?.status === 401) {
          dispatch(signOut());
          router.push("/signin?redirect=/restaurant/" + slug + "/settings");
        }
      }
    },
    [slug, router, dispatch, isReallyDirty, pendingImageOperations],
  );

  useEffect(() => {
    fetchRestaurantData();
  }, [fetchRestaurantData]);

  useEffect(() => {
    if (restaurantData) {
      form.reset({
        restaurantName: restaurantData.restaurantName ?? "",
        newSlug: restaurantData.slug ?? "",
        description: restaurantData.description ?? "",
        categories: restaurantData.categories ?? [],
        address: restaurantData.address ?? "",
        openingTime: restaurantData.openingTime ?? "",
        closingTime: restaurantData.closingTime ?? "",
        logoUrl: restaurantData.logoUrl ?? undefined,
      });
    }
  }, [restaurantData, form]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (logoUrl && logoUrl !== restaurantData?.logoUrl) {
        handleImageRemove();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoUrl, restaurantData]);

  if (isPageLoading) {
    return (
      <div className="h-[95vh] flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-1 flex-col px-6 py-4 pt-0">
      <div className="lg:sticky top-(--header-height) z-2 bg-background/40 pt-2 backdrop-blur-xl">
        <h1 className="text-2xl font-bold">Restaurant Settings</h1>
        <p className="text-muted-foreground mb-4 text-sm">
          Manage your restaurant&apos;s settings and preferences.
        </p>
      </div>
      <Form {...form}>
        <form
          className="space-y-4 relative flex items-start justify-between flex-col lg:flex-row-reverse mt-5"
          onSubmit={form.handleSubmit(onSubmit, (errors) =>
            console.log("Form errors:", errors),
          )}
        >
          <div className="lg:sticky top-[calc((var(--header-height)+6rem))] lg:max-w-1/3 grid">
            <p className="text-sm font-semibold mb-2">Restaurant Logo</p>
            {(imageFile || logoUrl) && (
              <div className="group relative mx-auto rounded-full inline-block ">
                <Avatar className="w-30 h-30 lg:w-50 lg:h-50 rounded-full">
                  <AvatarImage
                    src={logoUrl ? logoUrl : URL.createObjectURL(imageFile!)}
                    alt="Restaurant Logo"
                    className="object-cover"
                    loading="lazy"
                    draggable={false}
                  />
                </Avatar>
                {logoUrl && restaurantData?.logoUrl === logoUrl ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        className="absolute top-0 right-0 rounded-full bg-input/30 hover:bg-input/50"
                        variant="outline"
                        aria-label="Remove Logo"
                      >
                        <Trash2 className="text-red-600" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete this logo from the server. Even if you
                          don&apos;t submit or save this form.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-500 hover:bg-red-600 text-white"
                          onClick={handleImageRemove}
                        >
                          Continue
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button
                    type="button"
                    className="absolute top-0 right-0 rounded-full bg-input/30 hover:bg-input/50"
                    variant="outline"
                    onClick={handleImageRemove}
                    aria-label="Remove Logo"
                  >
                    <Trash2 className="text-red-600" />
                  </Button>
                )}
              </div>
            )}
            <div
              {...getRootProps()}
              className={`group rounded-full w-30 h-30 lg:w-50 lg:h-50 mx-auto ${(imageFile || logoUrl) && "hidden"} text-center cursor-pointer hover:bg-secondary/70 bg-secondary flex items-center justify-center ${
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
                className="bg-transparent hover:bg-transparent text-foreground/50 group-hover:text-foreground shadow-none"
              >
                <ImagePlusIcon />
                Select Logo
              </Button>
            </div>
            {imageErrorMessage && (
              <p className="text-red-500">{imageErrorMessage}</p>
            )}
            <span className="text-sm text-muted-foreground mt-2">
              Upload JPG, PNG, or JPEG image with a minimum size of 500x500
              pixels and a maximum file size of {MAX_IMAGE_SIZE / 1024 / 1024}
              MB.
            </span>
          </div>
          <div className="lg:max-w-1/2 space-y-4">
            <FormField
              control={form.control}
              name="restaurantName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="restaurantName">
                    Restaurant Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="restaurantName"
                      type="text"
                      placeholder="E.g., Restro"
                      autoComplete="restaurant-name"
                      required
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    The name of your restaurant. It will be displayed on your
                    restaurant page.
                    <span className="text-muted-foreground block">
                      Note: All your created restaurant names must be unique.
                    </span>
                  </FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newSlug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="slug">Slug</FormLabel>
                  <FormControl>
                    <Input
                      id="slug"
                      type="text"
                      placeholder="E.g., restro"
                      autoComplete="slug"
                      required
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        debounced(e.target.value);
                      }}
                    />
                  </FormControl>
                  {form.getValues("newSlug") ? (
                    isCheckingSlug ? (
                      <p className="text-sm text-muted-foreground">
                        Checking slug uniqueness...
                      </p>
                    ) : isSlugUnique === true ? (
                      <p className="text-sm text-green-500">
                        Slug is available
                      </p>
                    ) : (
                      <FormMessage />
                    )
                  ) : (
                    <FormMessage />
                  )}
                  <FormDescription>
                    A unique identifier for your restaurant. It will be used in
                    the URL for your restaurant&apos;s page.
                  </FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <FormLabel htmlFor="description">
                      Description (optional)
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Textarea
                      className="resize-none min-h-20 max-h-40"
                      id="description"
                      placeholder="E.g., Best restaurant in town"
                      autoComplete="description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    Optional, description of your restaurant.
                  </FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="address">Address (optional)</FormLabel>
                  <FormControl>
                    <Input
                      id="address"
                      type="text"
                      placeholder="E.g., 123 Restaurant St, City"
                      autoComplete="address"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    Optional, address of your restaurant.
                  </FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="categories">
                    Categories (optional)
                  </FormLabel>
                  <FormControl>
                    <TagsInput
                      id="categories"
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder={
                        field.value && field.value?.length > 0
                          ? "Add another category"
                          : "E.g., Indian, Chinese"
                      }
                      className="resize-none pb-4 whitespace-pre-wrap break-all"
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    Optional categories for your restaurant. After adding a
                    category, press Enter to add another category.
                  </FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="openingTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="openingTime">
                    Opening Time (optional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="openingTime"
                      type="text"
                      placeholder="E.g., 09:00"
                      autoComplete="openingTime"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    Optional, opening time of your restaurant. Write in HH:MM
                    format (24-hour clock).
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="closingTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="closingTime">
                    Closing Time (optional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="closingTime"
                      type="text"
                      placeholder="E.g., 23:00"
                      autoComplete="closingTime"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    Optional, closing time of your restaurant. Write in HH:MM
                    format (24-hour clock).
                  </FormDescription>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </Form>
      <div className="border border-destructive rounded-lg p-4 mt-8 bg-destructive/10 lg:max-w-1/2">
        <h3 className="text-lg font-medium text-red-500 mb-2">Danger Zone</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-red-500">
              {restaurantData?.isArchived
                ? "Unarchive Restaurant"
                : "Archive Restaurant"}
            </p>
            <p className="text-sm text-red-500">
              {restaurantData?.isArchived
                ? "Unarchiving will make your restaurant visible and active again."
                : "Archiving will hide your restaurant from customers and stop new orders."}
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Switch
                checked={restaurantData?.isArchived}
                className="aria-[checked=true]:bg-red-500 aria-[checked=false]:bg-secondary-foreground/20 cursor-pointer"
              />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  {restaurantData?.isArchived
                    ? "This will unarchive the restaurant and make it visible and active again."
                    : "Confirm to archive the restaurant"}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={toggleArchiveStatus}>
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default ClientPage;
