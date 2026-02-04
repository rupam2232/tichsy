"use client";

import Image from "next/image";
import { FileRejection, useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Loader2, Trash2, ImagePlusIcon } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { ScrollArea, ScrollBar } from "@repo/ui/components/scroll-area";
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
} from "@repo/ui/components/alert-dialog";;
import type { FoodItemDetails } from "@repo/ui/types/FoodItem";

interface FoodItemImageUploadProps {
  imageUrls: string[];
  imageFiles: File[] | null;
  setImageFiles: React.Dispatch<React.SetStateAction<File[] | null>>;
  imageErrorMessage: string;
  setImageErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  handleImageRemove: (url: string) => Promise<void>;
  handleImageUpload: (files: File[]) => Promise<void>;
  MAX_IMAGE_SIZE: number;
  userRole?: string; // "owner" | "admin" etc.
  foodItemDetails?: FoodItemDetails | null;
}

export default function FoodItemImageUpload({
  imageUrls,
  imageFiles,
  setImageFiles,
  imageErrorMessage,
  setImageErrorMessage,
  handleImageRemove,
  handleImageUpload,
  MAX_IMAGE_SIZE,
  userRole,
  foodItemDetails,
}: FoodItemImageUploadProps) {
  const onImageDrop = (
    acceptedFiles: File[],
    rejectedFiles: FileRejection[],
  ) => {
    const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg"];

    if (
      rejectedFiles.length > 0 &&
      rejectedFiles[0]?.errors[0]?.code === "file-too-large"
    ) {
      setImageErrorMessage("One or more files exceed the 1MB size limit");
      return;
    }

    if (!userRole || userRole !== "owner") {
      toast.error("You do not have permission to upload images");
      return;
    }

    if (
      rejectedFiles.length > 0 ||
      (acceptedFiles.length > 0 &&
        acceptedFiles.some(
          (file) => !file.type || !allowedImageTypes.includes(file.type),
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

  return (
    <>
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
                      <div key={index} className="aspect-square w-20 relative">
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
                                This action cannot be undone. This will
                                permanently delete this image from the server.
                                Even if you don&apos;t submit this form.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-500 hover:bg-red-600 text-white"
                                onClick={() => handleImageRemove(url)}
                              >
                                Continue
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  {imageFiles.map((file, index) => (
                    <div key={index} className="aspect-square w-20 relative">
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
                  <div key={index} className="aspect-square w-20 relative">
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
                              This action cannot be undone. This action will
                              permanently delete this image from the server.
                              Even if you don&apos;t submit this form.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
    </>
  );
}
