import { z } from "zod";

export const foodItemSchema = z.object({
  foodName: z
    .string("Food name must be a string")
    .min(1, "Food name is required")
    .max(50, "Food name cannot exceed 50 characters")
    .trim(),
  price: z
    .number("Price must be a positive number")
    .min(0, "Price must be a positive number")
    .optional(),
  discountedPrice: z
    .union([
      z
        .number(
          "Discounted price must be a positive number or zero to make it free",
        )
        .min(
          0,
          "Discounted price must be a positive number or zero to make it free",
        ),
      z.undefined(),
    ])
    .optional(),
  hasVariants: z.boolean("Has variants must be a boolean").optional(),
  variants: z.array(
    z.object({
      variantName: z
        .string("Variant name must be a string")
        .min(1, "Variant name is required")
        .max(50, "Variant name cannot exceed 50 characters")
        .trim(),
      price: z
        .number("Variant price must be a positive number")
        .min(0, "Variant price must be a positive number"),
      discountedPrice: z
        .union([
          z
            .number(
              "Variant discounted price must be a positive number or zero to make it free",
            )
            .min(
              0,
              "Variant discounted price must be a positive number or zero to make it free",
            ),
          z.undefined(),
        ])
        .optional(),
      description: z
        .string("Description must be a string")
        .max(100, "Variant description cannot exceed 100 characters")
        .trim()
        .optional(),
      isDefault: z.boolean().optional(),
    }),
  ).optional(),
  imageUrls: z
    .array(z.url("Invalid image URL"))
    .max(5, "You can upload a maximum of 5 images")
    .optional(),
  category: z
    .string("Category must be a string")
    .trim()
    .optional(),
  foodType: z
    .enum(["veg", "non-veg"], "Food type must be veg or non-veg"),
  description: z
    .string("Description must be a string")
    .max(200, "Description cannot exceed 200 characters")
    .trim()
    .optional(),
  tags: z
    .array(
      z
        .string("Tag must be a string")
        .min(1, "Tag cannot be empty")
        .max(30, "Tag cannot exceed 30 characters")
        .trim(),
    )
    .max(15, "You can only have a maximum of 15 tags")
    .optional(),
})
.refine(
  (data) => {
    if (!data.hasVariants && data.price === undefined) {
      return false;
    }
    return true;
  },
  {
    message: "Price is required when the food item does not have variants.",
    path: ["price"],
  }
)
.refine(
  (data) => {
    if (data.hasVariants && (!data.variants || data.variants.length === 0)) {
      return false;
    }
    return true;
  },
  {
    message: "At least one variant is required when hasVariants is true.",
    path: ["variants"],
  }
)
.refine(
  (data) => {
    if (data.hasVariants && data.variants && data.variants.length > 0) {
      const defaultCount = data.variants.filter((v) => v.isDefault).length;
      return defaultCount === 1;
    }
    return true;
  },
  {
    message: "Exactly one variant must be set as the default.",
    path: ["variants"],
  }
);
