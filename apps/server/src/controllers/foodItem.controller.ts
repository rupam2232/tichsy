import { FoodItem } from "../models/foodItem.model.js";
import type { FoodVariant as FoodVariantType } from "../models/foodItem.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Restaurant } from "../models/restaurant.models.js";
import {
  canCreateFoodItem,
  canUnarchiveFoodItem,
  checkVariantLimit,
} from "../service/foodItem.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import cloudinary from "../utils/cloudinary.js";
import { isValidObjectId } from "mongoose";

function hasDuplicates(arr: string[]): boolean {
  const lowerArr = arr.map((tag) => tag.trim().toLowerCase());
  // check if all the fields are available
  if (!Array.isArray(lowerArr) || lowerArr.length === 0) {
    return false; // No duplicates in an empty array
  }
  // Check for empty strings
  if (lowerArr.some((tag) => tag === "" || tag === null || tag === undefined)) {
    throw new ApiError(400, "Tags and names cannot be empty strings or null");
  }
  return new Set(lowerArr).size !== lowerArr.length;
}

export const createFoodItem = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== "owner") {
    throw new ApiError(403, "You are not authorized to create food items");
  }

  if (!req.params || !req.params.restaurantSlug) {
    throw new ApiError(400, "Restaurant slug is required");
  }

  if (
    !req.body ||
    !req.body.foodName ||
    !req.body.price ||
    !req.body.foodType
  ) {
    throw new ApiError(400, "Food name, price, and food type are required");
  }
  const {
    foodName,
    price,
    discountedPrice,
    hasVariants = false,
    variants = [],
    imageUrls = [],
    category,
    foodType,
    description,
    tags = [],
  } = req.body;

  if (foodType && !["veg", "non-veg"].includes(foodType)) {
    throw new ApiError(400, "Food type must be either 'veg' or 'non-veg'");
  }

  if (imageUrls.length > 5) {
    throw new ApiError(
      400,
      "You can only upload a maximum of 5 images for a food item"
    );
  }

  if (!hasVariants && variants.length > 0) {
    throw new ApiError(
      400,
      "Variants should not be provided when hasVariants is false"
    );
  }

  if (hasVariants && variants.length === 0) {
    throw new ApiError(400, "Variants are required when hasVariants is true");
  }

  if (hasVariants && variants.length > 6) {
    throw new ApiError(400, "You can only create a maximum of 6 food variants");
  }

  if (tags && !Array.isArray(tags)) {
    throw new ApiError(400, "Tags must be an array");
  }

  if (tags && tags.length > 15) {
    throw new ApiError(400, "You can only have a maximum of 15 tags");
  }

  // Usage for tags
  if (tags && tags.length > 0 && hasDuplicates(tags)) {
    throw new ApiError(400, "all Tags must be unique.");
  }

  // Usage for variants (assuming each variant has a variantName property)
  if (variants && variants.length > 0) {
    const variantNames = variants.map(
      (v: FoodVariantType) => v.variantName?.trim().toLowerCase() || ""
    );
    if (hasDuplicates(variantNames)) {
      throw new ApiError(400, "All variant names must be unique.");
    }
  }

  const restaurant = await Restaurant.findOne({
    slug: req.params.restaurantSlug,
    ownerId: req.user._id,
  });
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found or you are not the owner");
  }

  if (restaurant.isArchived) {
    throw new ApiError(
      403,
      "Restaurant is archived. Please unarchive restaurant to create food items"
    );
  }

  if (
    category &&
    (restaurant.categories.length === 0 ||
      !restaurant.categories.includes(category))
  ) {
    throw new ApiError(
      400,
      "Category must be one of the restaurant's categories"
    );
  }

  await canCreateFoodItem(req.subscription!, restaurant._id!.toString());

  if (hasVariants) {
    await checkVariantLimit(variants.length, req.subscription!);
  }
  // Check if the food item already exists
  const existingFoodItem = await FoodItem.findOne({
    restaurantId: restaurant._id,
    foodName,
  });

  if (existingFoodItem) {
    throw new ApiError(
      400,
      "Food item with this name already exists in the restaurant"
    );
  }

  // Create the food item
  const foodItem = await FoodItem.create({
    restaurantId: restaurant._id,
    foodName,
    price,
    discountedPrice,
    hasVariants,
    variants,
    imageUrls,
    category,
    foodType,
    description,
    tags,
  });

  if (!foodItem) {
    throw new ApiError(500, "Failed to create food item");
  }
  res
    .status(201)
    .json(new ApiResponse(201, foodItem, "Food item created successfully"));
});

export const getFoodItemsOfRestaurant = asyncHandler(async (req, res) => {
  if (!req.params || !req.params.restaurantSlug) {
    throw new ApiError(400, "Restaurant slug is required");
  }

  const {
    page = 1,
    limit = 10,
    sortBy = "foodName", // Default sort by foodName
    sortType = "asc",
    tab = "all", // Default tab is 'all'
    search = "", // Optional search query
  } = req.query;

  let {
    category = "", // Optional category filter
    foodType = "", // Optional food type filter
    isAvailable = "", // Optional availability filter
  } = req.query;

  const pageNumber = parseInt(page.toString());
  const limitNumber = parseInt(limit.toString());

  if (pageNumber < 1 || limitNumber < 1) {
    throw new ApiError(400, "Page and limit must be positive integers");
  }

  const restaurant = await Restaurant.findOne({
    slug: req.params.restaurantSlug,
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  // Validate sortBy and sortType
  if (tab !== "all") {
    switch (tab) {
      case "available":
        if (isAvailable && isAvailable !== "true") {
          throw new ApiError(
            400,
            "Invalid availability filter for 'available' tab"
          );
        }
        isAvailable = "true"; // Force availability to true for 'available' tab
        break;
      case "unavailable":
        if (isAvailable && isAvailable !== "false") {
          throw new ApiError(
            400,
            "Invalid availability filter for 'unavailable' tab"
          );
        }
        isAvailable = "false"; // Force availability to false for 'unavailable' tab
        break;
      case "veg":
        if (foodType && foodType !== "veg") {
          throw new ApiError(400, "Invalid food type filter for 'veg' tab");
        }
        foodType = "veg"; // Force food type to 'veg' for 'veg' tab
        break;

      case "non-veg":
        if (foodType && foodType !== "non-veg") {
          throw new ApiError(400, "Invalid food type filter for 'non-veg' tab");
        }
        foodType = "non-veg"; // Force food type to 'non-veg' for 'non-veg' tab
        break;

      default:
        category = tab; // Use the tab as category filter for custom categories
        break;
    }
  }

  const decodedSearch = decodeURIComponent(search as string).trim();

  const foodItemCount = await FoodItem.countDocuments({
    restaurantId: restaurant._id,
    ...(category ? { category } : {}), // Filter by category if provided
    ...(foodType ? { foodType } : {}), // Filter by food type if provided
    ...(isAvailable ? { isAvailable: isAvailable === "true" } : {}), // Filter by availability if provided
    ...(decodedSearch
      ? {
          $or: [
            { foodName: { $regex: decodedSearch, $options: "i" } }, // Case-insensitive search
            { category: { $regex: decodedSearch, $options: "i" } },
            { description: { $regex: decodedSearch, $options: "i" } },
            {
              tags: {
                $elemMatch: {
                  $regex: decodedSearch,
                  $options: "i",
                },
              },
            },
            {
              variants: {
                $elemMatch: {
                  $or: [
                    { variantName: { $regex: decodedSearch, $options: "i" } },
                    { description: { $regex: decodedSearch, $options: "i" } },
                  ],
                },
              },
            },
          ],
        }
      : {}), // Filter by search query if provided
  });

  if (!foodItemCount || foodItemCount === 0) {
    res.status(200).json(
      new ApiResponse(
        200,
        {
          foodItems: [],
          page: pageNumber,
          limit: limitNumber,
          totalPages: 0,
          totalCount: 0,
        },
        "No food items found"
      )
    );
  } else {
    const foodItems = await FoodItem.find({
      restaurantId: restaurant._id,
      ...(category ? { category } : {}), // Filter by category if provided
      ...(foodType ? { foodType } : {}), // Filter by food type if provided
      ...(isAvailable ? { isAvailable: isAvailable === "true" } : {}), // Filter by availability if provided

      ...(decodedSearch
        ? {
            $or: [
              { foodName: { $regex: decodedSearch, $options: "i" } }, // Case-insensitive search
              { category: { $regex: decodedSearch, $options: "i" } },
              { description: { $regex: decodedSearch, $options: "i" } },
              {
                tags: {
                  $elemMatch: {
                    $regex: decodedSearch,
                    $options: "i",
                  },
                },
              },
              {
                variants: {
                  $elemMatch: {
                    $or: [
                      { variantName: { $regex: decodedSearch, $options: "i" } },
                      { description: { $regex: decodedSearch, $options: "i" } },
                    ],
                  },
                },
              },
            ],
          }
        : {}), // Filter by search query if provided
    })
      .sort({
        isAvailable: -1, // Sort by availability first (available items first)
        // Then sort by the specified field
        [sortBy.toString()]: sortType === "asc" ? 1 : -1, // Ascending or descending sort
      })
      .skip((pageNumber - 1) * limitNumber) // Pagination logic
      .limit(limitNumber) // Limit the number of results
      .select("-restaurantId -__v -tags -category -variants"); // Exclude unnecessary fields;

    const totalPages = Math.ceil(foodItemCount / limitNumber);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          foodItems,
          page: pageNumber,
          limit: limitNumber,
          totalPages,
          totalCount: foodItemCount,
        },
        "Food items fetched successfully"
      )
    );
  }
});

export const getFoodItemById = asyncHandler(async (req, res) => {
  if (!req.params || !req.params.foodItemId || !req.params.restaurantSlug) {
    throw new ApiError(400, "Food item ID and restaurant slug are required");
  }

  if (!isValidObjectId(req.params.foodItemId)) {
    throw new ApiError(400, "Invalid food item ID");
  }

  const foodItem = await FoodItem.findById(req.params.foodItemId)
    .select("-__v")
    .populate({ path: "restaurantId", select: "name slug categories" });

  if (!foodItem) {
    throw new ApiError(404, "Food item not found");
  }

  // Check if restaurantId is populated and has a slug property
  if (
    !foodItem.restaurantId ||
    typeof foodItem.restaurantId !== "object" ||
    !("slug" in foodItem.restaurantId) ||
    (foodItem.restaurantId as any).slug !== req.params.restaurantSlug
  ) {
    throw new ApiError(404, "Food item not found");
  }

  // Rename the populated field from restaurantId to restaurantDetails
  const foodItemObj = foodItem.toObject ? foodItem.toObject() : foodItem;
  (foodItemObj as any).restaurantDetails = foodItemObj.restaurantId;
  delete (foodItemObj as any).restaurantId;

  res
    .status(200)
    .json(new ApiResponse(200, foodItemObj, "Food item fetched successfully"));
});

export const toggleFoodItemAvailability = asyncHandler(async (req, res) => {
  if (!req.params || !req.params.foodItemId || !req.params.restaurantSlug) {
    throw new ApiError(400, "Food item ID and restaurant slug are required");
  }

  if (!isValidObjectId(req.params.foodItemId)) {
    throw new ApiError(400, "Invalid food item ID");
  }

  if (req.body?.isVariant && !req.body.variantId) {
    throw new ApiError(400, "Variant ID is required to toggle availability");
  }

  if (req.body?.isVariant && !isValidObjectId(req.body.variantId)) {
    throw new ApiError(400, "Invalid variant ID");
  }
  const isVariant = req.body?.isVariant || false;
  const variantId = req.body?.variantId;
  const restaurantSlug = req.params.restaurantSlug;
  const user = req.user;

  if (user!.restaurantIds!.length === 0) {
    throw new ApiError(
      403,
      "You do not have any restaurant associated with your account to update table status"
    );
  }

  let restaurant = null;
  if (user!.role === "owner") {
    restaurant = await Restaurant.findOne({
      slug: restaurantSlug,
      ownerId: user!._id,
    });
  } else if (user!.role === "staff") {
    restaurant = await Restaurant.findOne({
      slug: restaurantSlug,
      staffIds: { $in: [user!._id] },
    });
  } else {
    throw new ApiError(
      403,
      "You do not have permission to toggle table status"
    );
  }

  if (!restaurant || !restaurant._id) {
    throw new ApiError(
      404,
      "Restaurant not found or you do not have permission to toggle table status"
    );
  }

  if (restaurant.isArchived) {
    throw new ApiError(
      403,
      "Restaurant is archived. Please unarchive restaurant to toggle availability."
    );
  }

  const foodItem = await FoodItem.findById(req.params.foodItemId);
  if (!foodItem) {
    throw new ApiError(404, "Food item not found");
  }

  if (foodItem.restaurantId.toString() !== restaurant._id!.toString()) {
    throw new ApiError(
      403,
      "This food item does not belong to your restaurant"
    );
  }

  if (foodItem.isArchived) {
    throw new ApiError(403, "Cannot toggle availability of archived food item");
  }

  // Toggle availability
  if (isVariant) {
    const variant = foodItem.variants?.find(
      (v: FoodVariantType) => v._id!.toString() === variantId
    );
    if (!variant) {
      throw new ApiError(404, "Variant not found");
    }
    variant.isAvailable = !variant.isAvailable;

    const updatedFoodItem = await foodItem.save();
    if (!updatedFoodItem) {
      throw new ApiError(500, "Failed to update food item availability");
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedFoodItem,
          `Variant is set to ${variant.isAvailable ? "available" : "not available"}`
        )
      );
  } else {
    foodItem.isAvailable = !foodItem.isAvailable;

    const updatedFoodItem = await foodItem.save();
    if (!updatedFoodItem) {
      throw new ApiError(500, "Failed to update food item availability");
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedFoodItem,
          `Food item is set to ${updatedFoodItem.isAvailable ? "available" : "not available"}`
        )
      );
  }
});

export const updateFoodItem = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== "owner") {
    throw new ApiError(403, "You are not authorized to update food items");
  }

  if (!req.params || !req.params.foodItemId || !req.params.restaurantSlug) {
    throw new ApiError(400, "Food item ID and restaurant slug are required");
  }

  if (!isValidObjectId(req.params.foodItemId)) {
    throw new ApiError(400, "Invalid food item ID");
  }

  const restaurant = await Restaurant.findOne({
    slug: req.params.restaurantSlug,
    ownerId: req.user._id,
  });
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found or you are not the owner");
  }

  if (restaurant.isArchived) {
    throw new ApiError(
      403,
      "Restaurant is archived. Please unarchive restaurant to update food item."
    );
  }

  const foodItem = await FoodItem.findById(req.params.foodItemId);

  if (!foodItem) {
    throw new ApiError(404, "Food item not found");
  }

  if (foodItem.restaurantId.toString() !== restaurant._id!.toString()) {
    throw new ApiError(
      403,
      "This food item does not belong to your restaurant"
    );
  }

  if (foodItem.isArchived) {
    throw new ApiError(403, "Cannot make changes in a archived food item");
  }

  if (!req.body || !req.body.foodName || req.body.foodName.trim() === "") {
    throw new ApiError(400, "Food name is required");
  }
  if (!req.body.price || isNaN(req.body.price) || req.body.price < 0) {
    throw new ApiError(400, "Valid price is required");
  }

  const {
    foodName,
    price,
    discountedPrice,
    hasVariants = foodItem.hasVariants,
    variants = foodItem.variants,
    imageUrls = foodItem.imageUrls || [],
    category = foodItem.category,
    foodType = foodItem.foodType,
    description = foodItem.description,
    tags = foodItem.tags || [],
  } = req.body;

  if (foodType && !["veg", "non-veg"].includes(foodType)) {
    throw new ApiError(400, "Food type must be either 'veg' or 'non-veg'");
  }

  if (imageUrls.length > 5) {
    throw new ApiError(
      400,
      "You can only upload a maximum of 5 images for a food item"
    );
  }

  if (!hasVariants && variants.length > 0) {
    throw new ApiError(
      400,
      "Variants should not be provided or should be a empty array when hasVariants is false"
    );
  }
  if (hasVariants && variants.length === 0) {
    throw new ApiError(400, "Variants are required when hasVariants is true");
  }

  if (hasVariants && variants.length > 6) {
    throw new ApiError(400, "You can only create a maximum of 6 food variants");
  }

  // Check subscription limits if updating variants
  if (hasVariants && variants.length > 0) {
    await checkVariantLimit(variants.length, req.subscription!);
  }

  if (tags && !Array.isArray(tags)) {
    throw new ApiError(400, "Tags must be an array");
  }

  if (tags && tags.length > 15) {
    throw new ApiError(400, "You can only have a maximum of 15 tags");
  }

  // Usage for tags
  if (tags && tags.length > 0 && hasDuplicates(tags)) {
    throw new ApiError(400, "all Tags must be unique.");
  }

  // Usage for variants (assuming each variant has a variantName property)
  if (variants && variants.length > 0) {
    const variantNames = variants.map(
      (v: FoodVariantType) => v.variantName?.trim().toLowerCase() || ""
    );
    if (hasDuplicates(variantNames)) {
      throw new ApiError(400, "All variant names must be unique.");
    }
  }

  // Check if the food item with the same name already exists in the restaurant
  const existingFoodItem = await FoodItem.findOne({
    restaurantId: restaurant._id,
    foodName: { $regex: foodName, $options: "i" }, // Case-insensitive search
    _id: { $ne: foodItem._id }, // Exclude the current food item from the check ($ne means "not equal to")
  });

  if (existingFoodItem) {
    throw new ApiError(
      400,
      "Food item with this name already exists in the restaurant"
    );
  }
  // Update the food item
  foodItem.foodName = foodName;
  foodItem.price = price;
  foodItem.discountedPrice = discountedPrice;
  foodItem.hasVariants = hasVariants;
  foodItem.variants = variants;
  foodItem.imageUrls = imageUrls;
  foodItem.category = category;
  foodItem.foodType = foodType;
  foodItem.description = description;
  foodItem.tags = tags;

  const updatedFoodItem = await foodItem.save();
  if (!updatedFoodItem) {
    throw new ApiError(500, "Failed to update food item");
  }

  // Return the updated food item
  res
    .status(200)
    .json(
      new ApiResponse(200, updatedFoodItem, "Food item updated successfully")
    );
});

export const deleteFoodItem = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== "owner") {
    throw new ApiError(403, "You are not authorized to delete food items");
  }

  if (!req.params || !req.params.foodItemId || !req.params.restaurantSlug) {
    throw new ApiError(400, "Food item ID and restaurant slug are required");
  }

  if (!isValidObjectId(req.params.foodItemId)) {
    throw new ApiError(400, "Invalid food item ID");
  }

  const restaurant = await Restaurant.findOne({
    slug: req.params.restaurantSlug,
    ownerId: req.user._id,
  });
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found or you are not the owner");
  }

  if (restaurant.isArchived) {
    throw new ApiError(
      403,
      "Restaurant is archived. Please unarchive restaurant to delete food item."
    );
  }

  const foodItem = await FoodItem.findById(req.params.foodItemId);
  if (!foodItem) {
    throw new ApiError(404, "Food item not found");
  }

  if (foodItem.restaurantId.toString() !== restaurant._id!.toString()) {
    throw new ApiError(
      403,
      "This food item does not belong to your restaurant"
    );
  }

  if (foodItem.imageUrls && foodItem.imageUrls.length > 0) {
    for (const imageUrl of foodItem.imageUrls) {
      await cloudinary.delete(imageUrl);
    }
  }

  await foodItem.deleteOne();

  res
    .status(200)
    .json(new ApiResponse(200, null, "Food item deleted successfully"));
});

export const toggleFoodItemArchiveStatus = asyncHandler(async (req, res) => {
  if (!req.params || !req.params.foodItemId || !req.params.restaurantSlug) {
    throw new ApiError(400, "foodItemId and restaurantSlug are required");
  }
  const { foodItemId, restaurantSlug } = req.params;

  if (!isValidObjectId(foodItemId)) {
    throw new ApiError(400, "Invalid food item ID");
  }

  const user = req.user;

  if (user!.role !== "owner") {
    throw new ApiError(
      403,
      "You do not have permission to toggle food item archive status"
    );
  }

  const restaurant = await Restaurant.findOne({
    slug: restaurantSlug,
    ownerId: user!._id,
  });

  if (!restaurant) {
    throw new ApiError(
      404,
      "Restaurant not found or you do not own this restaurant"
    );
  }

  if (restaurant.isArchived) {
    throw new ApiError(
      403,
      "Restaurant is archived. Please unarchive restaurant to toggle this food item's archive status"
    );
  }

  const foodItem = await FoodItem.findOne({
    _id: foodItemId,
    restaurantId: restaurant._id,
  });

  if (!foodItem) {
    throw new ApiError(404, "food item not found");
  }

  // If unarchiving, check subscription limits
  if (foodItem.isArchived) {
    await canUnarchiveFoodItem(req.subscription!, restaurant.id);
    foodItem.isArchived = false;
    foodItem.archivedAt = undefined;
    foodItem.archivedReason = undefined;
  } else {
    // Archiving is always allowed manually
    foodItem.isArchived = true;
    foodItem.archivedAt = new Date();
    foodItem.archivedReason = req.body?.archivedReason ?? "Archived by owner";
  }

  await foodItem.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        foodItem,
        "Food item archive status toggled successfully"
      )
    );
});
