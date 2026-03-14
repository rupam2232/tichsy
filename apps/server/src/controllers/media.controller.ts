import { Restaurant } from "../models/restaurant.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import cloudinary from "../utils/cloudinary.js";
import fs from "fs";
import { TemporaryMedia } from "../models/temporaryMedia.model.js";
import { FoodItem } from "../models/foodItem.model.js";
import type { FoodItem as FoodItemType } from "../models/foodItem.model.js";
import { isValidObjectId } from "mongoose";
import {
  foodItemImageDeleteSchema,
  foodItemImageUploadSchema,
  restaurantLogoDeleteSchema,
  restaurantLogoUploadSchema,
} from "@repo/types";

export const restaurantLogoUpload = asyncHandler(async (req, res) => {
  const logoLocalPath = req.file?.path;
  if (!logoLocalPath) {
    throw new ApiError(400, "Logo file is required");
  }

  let restaurant: Restaurant | null = null;
  const validatedData = restaurantLogoUploadSchema.parse(req.body);
  const { restaurantId } = validatedData;

  if (restaurantId) {
    // If restaurantId is provided, update the corresponding restaurant
    if (!isValidObjectId(restaurantId)) {
      fs.unlinkSync(logoLocalPath); // Remove the file if restaurantId is invalid
      throw new ApiError(400, "Invalid restaurant ID");
    }
    restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      fs.unlinkSync(logoLocalPath); // Remove the file if restaurant is not found
      throw new ApiError(404, "Restaurant not found");
    }
    // Check if the user owns the restaurant
    if (restaurant.ownerId.toString() !== req.user!._id!.toString()) {
      fs.unlinkSync(logoLocalPath); // Remove the file if the user does not own the restaurant
      throw new ApiError(403, "You do not own this restaurant");
    }
  }

  const uploadResponse = await cloudinary.upload(
    logoLocalPath,
    `restaurant-logos/restaurants-${req.user!._id}` // Use the owner's ID to create a unique folder
  );
  if (!uploadResponse) {
    fs.unlinkSync(logoLocalPath); // Remove the file if upload fails
    throw new ApiError(500, "Failed to upload logo to Cloudinary");
  }

  await TemporaryMedia.create({
    userId: req.user!._id,
    mediaUrl: uploadResponse.secure_url,
  });

  // If restaurantId is provided, update the restaurant's logoUrl
  if (restaurantId && restaurant) {
    restaurant.logoUrl = uploadResponse.secure_url;
    await restaurant.save({ validateBeforeSave: false }); // Save the restaurant without validation
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        uploadResponse.secure_url,
        "Logo uploaded successfully"
      )
    );
});

export const restaurantLogoDelete = asyncHandler(async (req, res) => {
  const validatedData = restaurantLogoDeleteSchema.parse(req.body);
  const { mediaUrl, restaurantId } = validatedData;

  // Global role check removed.

  let restaurant: Restaurant | null = null;

  // Check if the mediaUrl exists in TemporaryMedia
  const tempMedia = await TemporaryMedia.findOne({
    userId: req.user!._id,
    mediaUrl: mediaUrl,
  });

  if (restaurantId) {
    if (!isValidObjectId(restaurantId)) {
      throw new ApiError(400, "Invalid restaurant ID");
    }
    if (!req.user!.restaurantIds || req.user!.restaurantIds.length === 0) {
      throw new ApiError(403, "User does not own any restaurants");
    }
    // If restaurantId is provided, check if the user owns that restaurant
    restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new ApiError(404, "Restaurant not found");
    }
    if (restaurant.ownerId.toString() !== req.user!._id!.toString()) {
      throw new ApiError(403, "You do not own this restaurant");
    }
    // Check if the mediaUrl matches the restaurant's logoUrl
    if (restaurant.logoUrl !== mediaUrl) {
      // If the logoUrl does not match, check if it exists in TemporaryMedia
      if (!tempMedia) {
        throw new ApiError(
          404,
          "Logo not found in restaurant or temporary media"
        );
      }
    }
  }
  if (!restaurant && !tempMedia) {
    throw new ApiError(
      404,
      "Logo not found in user's restaurants or temporary media"
    );
  }

  const response = await cloudinary.delete(mediaUrl);

  if (!response || response.result !== "ok") {
    throw new ApiError(500, "Failed to delete logo from Cloudinary");
  }
  // If the logo was in TemporaryMedia, delete it from there
  if (tempMedia) {
    // Remove the logo from TemporaryMedia
    await tempMedia.deleteOne();
  }
  if (restaurant && restaurant.logoUrl === mediaUrl && restaurantId) {
    // If the logo was in Restaurant, update the restaurant's logoUrl
    restaurant.logoUrl = undefined;
    await restaurant.save({ validateBeforeSave: false }); // Save the restaurant without validation
  }
  res.status(200).json(new ApiResponse(200, null, "Logo deleted successfully"));
});

export const foodItemImageUpload = asyncHandler(async (req, res) => {
  const imageLocalPaths = Array.isArray(req.files) ? req.files : [];
  if (!imageLocalPaths || imageLocalPaths.length === 0) {
    throw new ApiError(400, "At least one image file is required");
  }
  if (imageLocalPaths.length > 5) {
    imageLocalPaths.forEach((file: Express.Multer.File) => {
      fs.unlinkSync(file.path); // Remove the files if more than 5 images are uploaded
    });
    throw new ApiError(400, "You can only upload a maximum of 5 images");
  }

  let foodItem: FoodItemType | null = null;
  const validatedData = foodItemImageUploadSchema.parse(req.body);
  const { foodItemId } = validatedData;

  if (foodItemId) {
    // If foodItemId is provided, update the corresponding food item
    if (!isValidObjectId(foodItemId)) {
      imageLocalPaths.forEach((file: Express.Multer.File) => {
        fs.unlinkSync(file.path); // Remove the file if foodItemId is invalid
      });
      throw new ApiError(400, "Invalid food item ID");
    }
    foodItem = await FoodItem.findById(foodItemId);
    if (!foodItem) {
      imageLocalPaths.forEach((file: Express.Multer.File) => {
        fs.unlinkSync(file.path); // Remove the file if food item is not found
      });
      throw new ApiError(404, "Food item not found");
    }
    // Check if the user owns the restaurant of the food item
    if (
      !req.user?.restaurantIds
        ?.map((id) => id.toString())
        .includes(foodItem.restaurantId.toString())
    ) {
      imageLocalPaths.forEach((file: Express.Multer.File) => {
        fs.unlinkSync(file.path); // Remove the file if the user does not own the restaurant
      });
      throw new ApiError(403, "You do not own this restaurant");
    }

    // Check if the food item already has 5 images
    if (foodItem.imageUrls && foodItem.imageUrls.length >= 5) {
      imageLocalPaths.forEach((file: Express.Multer.File) => {
        fs.unlinkSync(file.path); // Remove the files if the food item already has 5 images
      });
      throw new ApiError(400, "Food item already has 5 images");
    }

    if (
      foodItem.imageUrls &&
      foodItem.imageUrls.length + imageLocalPaths.length > 5
    ) {
      imageLocalPaths.forEach((file: Express.Multer.File) => {
        fs.unlinkSync(file.path); // Remove the files if the total exceeds 5 images
      });
      throw new ApiError(400, "Total images for food item cannot exceed 5");
    }
  }

  const uploadPromises = imageLocalPaths.map((file: Express.Multer.File) => {
    return cloudinary.upload(
      file.path,
      `menu-item-images/restaurants-${req.user!._id}`
    );
  });

  const uploadResponses = await Promise.all(uploadPromises);
  const imageUrls = uploadResponses
    .filter((response) => response && response.secure_url)
    .map((response) => response!.secure_url);

  if (imageUrls.length === 0) {
    imageLocalPaths.forEach((file: Express.Multer.File) => {
      fs.unlinkSync(file.path); // Remove files if upload fails
    });
    throw new ApiError(500, "Failed to upload images to Cloudinary.");
  }

  // Save the image URLs to TemporaryMedia one by one
  const tempMediaPromises = imageUrls.map((url) => {
    return TemporaryMedia.create({
      userId: req.user!._id,
      mediaUrl: url,
    });
  });

  await Promise.all(tempMediaPromises);

  if (foodItemId && foodItem) {
    // Add the new image URLs to the food item's images array
    foodItem.imageUrls!.push(...imageUrls); // Add new image URLs
    foodItem.imageUrls = Array.from(new Set(foodItem.imageUrls)); // Remove duplicates
    await foodItem.save({ validateBeforeSave: false }); // Save without validation
  }

  res
    .status(200)
    .json(new ApiResponse(200, imageUrls, "Images uploaded successfully"));
});

export const deleteFoodItemImage = asyncHandler(async (req, res) => {
  const validatedData = foodItemImageDeleteSchema.parse(req.body);
  const { mediaUrl, foodItemId } = validatedData;

  let foodItem: FoodItemType | null = null;

  if (foodItemId) {
    // If foodItemId is provided, update the corresponding food item
    if (!isValidObjectId(foodItemId)) {
      throw new ApiError(400, "Invalid food item ID");
    }
    foodItem = await FoodItem.findById(foodItemId);
    if (!foodItem) {
      throw new ApiError(404, "Food item not found");
    }

    if (
      !req.user?.restaurantIds
        ?.map((id) => id.toString())
        .includes(foodItem.restaurantId.toString())
    ) {
      throw new ApiError(403, "You do not own this restaurant");
    }

    // Check if the mediaUrl exists in the food item's images
    if (
      !foodItem.imageUrls ||
      foodItem.imageUrls.length === 0 ||
      !foodItem.imageUrls.includes(mediaUrl)
    ) {
      throw new ApiError(404, "Image not found in food item");
    }

    // Remove the image URL from the food item's images array
    if (foodItem.imageUrls && foodItem.imageUrls.length > 0) {
      foodItem.imageUrls = foodItem.imageUrls.filter((img) => img !== mediaUrl);
    }
  }

  // Check if the mediaUrl exists in TemporaryMedia
  const tempMedia = await TemporaryMedia.findOne({
    userId: req.user!._id,
    mediaUrl: mediaUrl,
  });
  if (!tempMedia && !foodItem) {
    // If not found in TemporaryMedia and no food item, return 404
    throw new ApiError(404, "Image not found");
  }

  const response = await cloudinary.delete(mediaUrl);

  if (!response || response.result !== "ok") {
    throw new ApiError(500, "Failed to delete image from Cloudinary");
  }

  // Remove the image from TemporaryMedia
  if (tempMedia) {
    await tempMedia.deleteOne();
  }

  // If the image was in FoodItem, update the food item
  if (foodItem) {
    await foodItem.save({ validateBeforeSave: false }); // Save the food item without validation
  }

  res
    .status(200)
    .json(new ApiResponse(200, null, "Image deleted successfully"));
});
