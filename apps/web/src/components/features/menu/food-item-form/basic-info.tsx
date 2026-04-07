"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
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
import { Button } from "@repo/ui/components/button";
import { TagsInput } from "@repo/ui/components/tags-input";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { NonVegIcon, VegIcon } from "@/components/shared/veg-nonveg-tooltip";
import CreateRestaurantCategory from "../create-restaurant-category";
import { UseFormReturn, useWatch } from "react-hook-form";
import { useState, useMemo } from "react";
import { z } from "zod";
import { FoodItemDetails, foodItemSchema } from "@repo/types";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

interface FoodItemBasicInfoProps {
  form: UseFormReturn<z.infer<typeof foodItemSchema>>;
  restaurantSlug: string;
  foodItemDetails?: FoodItemDetails | null;
  formLoading: boolean;
  setFormLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function FoodItemBasicInfo({
  form,
  restaurantSlug,
  foodItemDetails,
  formLoading,
  setFormLoading,
}: FoodItemBasicInfoProps) {
  const activeRestaurant = useSelector(
    (state: RootState) => state.restaurantsSlice.activeRestaurant,
  );

  const discountedPrice = useWatch({
    control: form.control,
    name: "discountedPrice",
  });

  const hasVariants = useWatch({
    control: form.control,
    name: "hasVariants",
  });

  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);
  const categories = useMemo(() => activeRestaurant?.categories ?? [], [activeRestaurant]);
  return (
    <>
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
      {!hasVariants && (
        <>
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
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    onWheel={(e) => {
                      (e.target as HTMLInputElement).blur();
                    }}
                    step={"0"}
                  />
                </FormControl>
                <FormMessage />
                <FormDescription>
                  The original price of the food item. Must be a positive number.
                </FormDescription>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="discountedPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="discountedPrice">Discounted Price</FormLabel>
                <FormControl>
                  <Input
                    id="discountedPrice"
                    type="number"
                    inputMode="numeric"
                    placeholder="E.g., 80"
                    autoComplete="off"
                    {...field}
                    value={discountedPrice === undefined ? "" : discountedPrice} // Convert undefined to an empty string
                    onChange={(e) => {
                      const value = e.target.value;
                      const number = value === "" ? undefined : Number(value); // Convert empty string to undefined
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
                  Optional discounted price for the food item. Must be a positive
                  number.
                </FormDescription>
              </FormItem>
            )}
          />
        </>
      )}
      <FormField
        control={form.control}
        name="foodType"
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="foodType">Food Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="text-sm font-medium w-[180px] border-muted-foreground/70">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="veg">
                  <VegIcon className="ml-1" />
                  Veg
                </SelectItem>
                <SelectItem value="non-veg">
                  <NonVegIcon className="ml-1" />
                  Non Veg
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
            <FormDescription>
              Type of food (e.g., &quot;veg&quot; or &quot;non veg&quot;).
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
              <Popover
                open={isCategoryPopoverOpen}
                onOpenChange={setIsCategoryPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-[200px] justify-between",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value
                        ? categories.length > 0
                          ? categories.find(
                              (category) => category === field.value,
                            )
                          : foodItemDetails?.restaurantDetails.categories.find(
                              (category) => category === field.value,
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
                      <CommandEmpty>No category found.</CommandEmpty>
                      <div className="p-1 pb-0 w-full space-y-1">
                        <CreateRestaurantCategory
                          isLoading={formLoading}
                          setIsLoading={setFormLoading}
                          restaurantSlug={restaurantSlug}
                          categories={categories}
                        />
                        <Button
                          variant="ghost"
                          className="w-full text-sm font-normal h-min py-1.5 px-2! hover:bg-accent!"
                          onClick={() => {
                            form.setValue("category", "", {
                              shouldDirty: true,
                              shouldValidate: true,
                              shouldTouch: true,
                            });
                            setIsCategoryPopoverOpen(false);
                          }}
                        >
                          No category
                          <Check
                            className={cn(
                              "ml-auto",
                              "" === field.value || undefined === field.value
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                        </Button>
                      </div>
                      <CommandGroup>
                        {categories.length > 0 ? (
                          categories.map((category) => (
                            <CommandItem
                              key={category}
                              value={category}
                              className="cursor-pointer"
                              onSelect={() => {
                                form.setValue("category", category, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                  shouldTouch: true,
                                });
                                setIsCategoryPopoverOpen(false);
                              }}
                            >
                              {category}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  category === field.value
                                    ? "opacity-100"
                                    : "opacity-0",
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
              Optional description for the food item. After adding a tag, press
              Enter to add another tag.
            </FormDescription>
          </FormItem>
        )}
      />
    </>
  );
}
