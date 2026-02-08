import { z } from "zod";

export const addToCartSchema = z.object({
  foodId: z.string("Food id must be a string").min(1, "Food ID is required"),
  quantity: z
    .number("Quantity must be a number")
    .min(1, "Quantity must be greater than zero")
    .int("Quantity must be an integer"),
  variantName: z.string("Variant name must be a string").optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z
    .number("Quantity must be a number")
    .min(1, "Quantity must be greater than zero")
    .int("Quantity must be an integer"),
  variantName: z.string("Variant name must be a string").optional(),
});

export const removeFromCartSchema = z.object({
  quantity: z
    .number("Quantity must be a number")
    .min(1, "Quantity must be greater than zero")
    .int("Quantity must be an integer"),
  variantName: z.string("Variant name must be a string").optional().nullable(),
});
