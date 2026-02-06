import { z } from "zod";

export const createOrderSchema = z.object({
  foodItems: z
    .array(
      z.object({
        _id: z
          .string("Food item ID must be a string")
          .min(1, "Food item ID is required"),
        quantity: z
          .number("Quantity must be a number")
          .int("Quantity must be an integer")
          .positive("Quantity must be positive"),
        variantName: z
          .string("Variant name must be a string")
          .optional(),
      }),
    )
    .min(1, "At least one food item is required"),
  paymentMethod: z
    .enum(["online", "cash"], "Invalid payment method"),
  notes: z
    .string("Notes must be a string")
    .optional(),
  customerName: z
    .string("Customer name must be a string")
    .optional(),
  customerPhone: z
    .string("Customer phone must be a string")
    .optional(),
});
