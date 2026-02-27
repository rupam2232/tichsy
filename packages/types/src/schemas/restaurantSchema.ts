import { z } from "zod";

export const createRestaurantSchema = z.object({
  restaurantName: z
    .string("Restaurant name must be a string")
    .trim()
    .min(1, "Restaurant name is required"),
  slug: z
    .string("Slug must be a string")
    .trim()
    .min(3, "Slug must be at least 3 characters long")
    .max(20, "Slug must not exceed 20 characters length")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase and can only contain letters, numbers, and hyphens",
    ),
  description: z.string("Description must be a string").trim().optional(),
  address: z.string("Address must be a string").trim().optional(),
  logoUrl: z.url("Invalid URL format").optional(),
});

export const addCategorySchema = z.object({
  category: z
    .string("Category name must be a string")
    .trim()
    .min(1, "Category name is required")
    .max(40, "Category name must not exceed 40 characters"),
});

export const updateRestaurantSchema = z.object({
  restaurantName: z
    .string("Restaurant name must be a string")
    .trim()
    .min(1, "Restaurant name is required"),
  newSlug: z
    .string("Slug must be a string")
    .trim()
    .min(3, "Slug must be at least 3 characters long")
    .max(20, "Slug must not exceed 20 characters length")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase and can only contain letters, numbers, and hyphens",
    ),
  description: z
    .string("Description must be a string")
    .trim()
    .max(1000, "Description must not exceed 1000 characters")
    .optional(),
  address: z
    .string("Address must be a string")
    .trim()
    .max(1000, "Address must not exceed 1000 characters")
    .optional(),
  openingTime: z
    .string("Opening time must be a string")
    .trim()
    .regex(
      /^$|^([01]\d|2[0-3]):([0-5]\d)$/,
      "Invalid opening time format (HH:MM)",
    )
    .optional(),
  closingTime: z
    .string("Closing time must be a string")
    .trim()
    .regex(
      /^$|^([01]\d|2[0-3]):([0-5]\d)$/,
      "Invalid closing time format (HH:MM)",
    )
    .optional(),
  categories: z
    .array(
      z
        .string("Category name must be a string")
        .trim()
        .min(1, "Category name is required")
        .max(40, "Category name must not exceed 40 characters"),
    )
    .optional(),
  logoUrl: z
    .url("Invalid URL format")
    .optional(),
})
.superRefine((data, ctx) => {
  if (data.openingTime && !data.closingTime) {
    ctx.addIssue({
      code: "custom",
      message: "Closing time is required when opening time is provided",
      path: ["closingTime"],
    });
  }
  if (!data.openingTime && data.closingTime) {
    ctx.addIssue({
      code: "custom",
      message: "Opening time is required when closing time is provided",
      path: ["openingTime"],
    });
  }
});
export const addStaffSchema = z.object({
  email: z.email("Email must be a valid email address").trim(),
});
