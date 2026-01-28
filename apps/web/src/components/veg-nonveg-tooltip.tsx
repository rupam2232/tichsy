import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { cn } from "@repo/ui/lib/utils";

export const VegIcon = ({
  className,
  innerClassName,
}: {
  className?: string;
  innerClassName?: string;
}) => {
  return (
    <div
      className={cn(
        "border border-green-500 bg-white outline outline-white p-0.5",
        className
      )}
    >
      <span
        className={cn(
          "bg-green-500 w-1.5 h-1.5 block rounded-full",
          innerClassName
        )}
      ></span>
    </div>
  );
};

export const NonVegIcon = ({
  className,
  innerClassName,
}: {
  className?: string;
  innerClassName?: string;
}) => {
  return (
    <div
      className={cn(
        "border border-red-500 bg-white outline outline-white p-0.5",
        className
      )}
    >
      <span
        className={cn(
          "bg-red-500 w-1.5 h-1.5 block rounded-full",
          innerClassName
        )}
      ></span>
    </div>
  );
};

export const VeganIcon = ({
  className,
  innerClassName,
}: {
  className?: string;
  innerClassName?: string;
}) => {
  return (
    <div
      className={cn(
        "border border-yellow-500 bg-white outline outline-white p-0.5",
        className
      )}
    >
      <span
        className={cn(
          "bg-yellow-500 w-1.5 h-1.5 block rounded-full",
          innerClassName
        )}
      ></span>
    </div>
  );
};

const VegNonVegTooltip = ({
  foodType,
  className,
  innerClassName,
}: {
  foodType: "veg" | "non-veg" | "vegan";
  className?: string;
  innerClassName?: string;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger>
        {foodType === "veg" ? (
          <VegIcon className={className} innerClassName={innerClassName} />
        ) : foodType === "non-veg" ? (
          <NonVegIcon className={className} innerClassName={innerClassName} />
        ) : (
          <VeganIcon className={className} innerClassName={innerClassName} />
        )}
      </TooltipTrigger>
      <TooltipContent>
        {foodType === "veg"
          ? "Veg"
          : foodType === "non-veg"
            ? "Non Veg"
            : "Vegan"}
      </TooltipContent>
    </Tooltip>
  );
};

export default VegNonVegTooltip;
