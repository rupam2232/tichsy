"use client";

import { useEffect } from "react";
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
import { Button } from "@repo/ui/components/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/accordion";
import { UseFormReturn, useFieldArray, useWatch } from "react-hook-form";
import { z } from "zod";
import { foodItemSchema } from "@repo/types";
import { Plus, Trash2 } from "lucide-react";

interface FoodItemVariantsProps {
  form: UseFormReturn<z.infer<typeof foodItemSchema>>;
  openParentAccordion: string | null;
  setOpenParentAccordion: React.Dispatch<React.SetStateAction<string | null>>;
  openChildAccordion: string[] | null;
  setOpenChildAccordion: React.Dispatch<React.SetStateAction<string[] | null>>;
}

export default function FoodItemVariants({
  form,
  openParentAccordion,
  setOpenParentAccordion,
  openChildAccordion,
  setOpenChildAccordion,
}: FoodItemVariantsProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const hasVariants = useWatch({
    control: form.control,
    name: "hasVariants",
  });

  const variantDiscountedPrices = useWatch({
    control: form.control,
    name: "variants",
  });

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
          (error) => error !== undefined,
        );
      }
      if (firstErrorIndex !== -1) {
        setOpenChildAccordion((prev) => [
          ...(prev || []),
          `item-${firstErrorIndex}`,
        ]);
      }
    }
  }, [
    form.formState.errors,
    fields,
    form,
    hasVariants,
    setOpenParentAccordion,
    setOpenChildAccordion,
  ]);

  if (!hasVariants) {
    return (
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
          <Plus />
          Add Variant
        </Button>
      </div>
    );
  }

  return (
    <>
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
                  variantDiscountedPrices?.[index]?.discountedPrice ??
                  undefined;

                return (
                  <Accordion
                    type="multiple"
                    className="w-full"
                    value={openChildAccordion || [""]}
                    onValueChange={(value) => setOpenChildAccordion(value)}
                    key={field.id}
                  >
                    <AccordionItem key={field.id} value={`item-${index}`}>
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
                                <FormLabel htmlFor={`variantName-${index}`}>
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
                                  Name of the variant (e.g., Large, Medium,
                                  Small).
                                </FormDescription>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`variants.${index}.price`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel htmlFor={`price-${index}`}>
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
                                  Price for this variant. Must be a positive
                                  number.
                                </FormDescription>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`variants.${index}.discountedPrice`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel htmlFor={`discountedPrice-${index}`}>
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
                                      discountedPrice === undefined
                                        ? ""
                                        : discountedPrice
                                    }
                                    onChange={(e) => {
                                      const value = e.target.value;
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
                                        },
                                      ); // Explicitly update the form state
                                    }}
                                    onWheel={(e) => {
                                      (e.target as HTMLInputElement).blur();
                                    }}
                                    step={"0"}
                                  />
                                </FormControl>
                                <FormMessage />
                                <FormDescription>
                                  Optional discounted price for this variant.
                                </FormDescription>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`variants.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel htmlFor={`description-${index}`}>
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
                                    {field?.value?.length || 0}/100
                                  </span>
                                </div>
                                <FormMessage />
                                <FormDescription>
                                  Optional description for this variant.
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
                            <span className="sr-only">Remove Variant</span>
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
          <Plus />
          {fields.length > 0 ? "Add Another Variant" : "Add Variant"}
        </Button>
      </div>
    </>
  );
}
