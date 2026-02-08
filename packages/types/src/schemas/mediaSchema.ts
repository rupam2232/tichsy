import { z } from "zod";

export const restaurantLogoUploadSchema = z.object({
  restaurantId: z.string("Restaurant id must be a string").optional(),
});

export const restaurantLogoDeleteSchema = z.object({
  mediaUrl: z.string("Media url must be a string").min(1, "Media URL is required"),
  restaurantId: z.string("Restaurant id must be a string").optional(),
});

export const foodItemImageUploadSchema = z.object({
  foodItemId: z.string("Food item id must be a string").optional(),
});

export const foodItemImageDeleteSchema = z.object({
  mediaUrl: z.string("Media url must be a string").min(1, "Media URL is required"),
  foodItemId: z.string("Food item id must be a string").optional(),
});
