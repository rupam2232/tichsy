import Image, { ImageProps } from "next/image";
import { useState } from "react";
import { IconSalad } from "@tabler/icons-react";
import { cn } from "@repo/ui/lib/utils";
import { cloudinaryLoader } from "@/utils/imageOptimizer";

interface FoodImageProps extends Omit<ImageProps, "loader" | "src"> {
  src?: string | null;
  fallbackIconClassName?: string;
}

export function FoodImage({
  src,
  alt,
  className,
  fallbackIconClassName,
  ...props
}: FoodImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-muted/40 dark:bg-muted",
          className
        )}
      >
        <IconSalad className={cn("size-8 sm:size-16", fallbackIconClassName)} />
      </div>
    );
  }

  return (
    <>
      <Image
        src={src}
        alt={alt || "Food item image"}
        loader={cloudinaryLoader}
        className={cn(
          "transition-all duration-300",
          isLoading ? "opacity-0 scale-95" : "opacity-100 scale-100",
          className
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        {...props}
      />
      {isLoading && (
        <div
          className={cn(
            "absolute inset-0 z-10 animate-pulse bg-muted",
            className
          )}
        />
      )}
    </>
  );
}
