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
import { Switch } from "@repo/ui/components/switch";
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
      form.setValue("hasVariants", false, {
        shouldDirty: true,
        shouldValidate: true,
        shouldTouch: true,
      });
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
            form.setValue("hasVariants", true, {
              shouldDirty: true,
              shouldValidate: true,
              shouldTouch: true,
            });
            append({
              variantName: "",
              price: 0,
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
          <AccordionTrigger className="cursor-pointer transition-all">
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
                      <AccordionTrigger className="cursor-pointer transition-all">
                        {field.variantName || "New Variant"}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="border p-4 rounded-md space-y-3">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="ml-auto flex"
                            onClick={() => {
                              const wasDefault = Boolean(
                                form.getValues(`variants.${index}.isDefault`),
                              );
                              remove(index);
                              if (wasDefault && fields.length > 1) {
                                setTimeout(() => {
                                  form.setValue(`variants.0.isDefault`, true, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  });
                                }, 0);
                              }
                            }}
                          >
                            <Trash2 />
                            <span className="sr-only">Remove Variant</span>
                          </Button>

                          <FormField
                            control={form.control}
                            name={`variants.${index}.isDefault`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                  <FormLabel>Set as Default Variant</FormLabel>
                                  <FormDescription>
                                    Automatically pre-selected for customers.
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    disabled={fields.length <= 1}
                                    className="cursor-pointer"
                                    checked={Boolean(field.value)}
                                    onCheckedChange={(checked) => {
                                      if (!checked) return;
                                      field.onChange(checked);
                                      if (checked) {
                                        fields.forEach((_, i) => {
                                          if (i !== index) {
                                            form.setValue(
                                              `variants.${i}.isDefault`,
                                              false,
                                              {
                                                shouldDirty: true,
                                                shouldValidate: true,
                                              },
                                            );
                                          }
                                        });
                                      }
                                    }}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
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
            form.setValue("hasVariants", true, {
              shouldDirty: true,
              shouldValidate: true,
              shouldTouch: true,
            });
            append({
              variantName: "",
              price: 0,
              discountedPrice: undefined,
              description: "",
              isDefault: fields.length === 0,
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
