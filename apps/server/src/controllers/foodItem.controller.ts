import { FoodItem } from "../models/foodItem.model.js";
import type { FoodVariant as FoodVariantType } from "../models/foodItem.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Restaurant } from "../models/restaurant.model.js";
import {
  canCreateFoodItem,
  canUnarchiveFoodItem,
  checkVariantLimit,
} from "../service/foodItem.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import cloudinary from "../utils/cloudinary.js";
import { isValidObjectId, FilterQuery } from "mongoose";
import { foodItemSchema } from "@repo/types";

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
  if (req.restaurantRole !== "owner") {
    throw new ApiError(403, "You are not authorized to create food items");
  }

  const validatedData = foodItemSchema.parse(req.body);

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
  } = validatedData;

  if (tags && tags.length > 0 && hasDuplicates(tags)) {
    throw new ApiError(400, "all Tags must be unique.");
  }

  if (variants && variants.length > 0) {
    const variantNames = variants.map(
      (v) => v.variantName?.trim().toLowerCase() || ""
    );
    if (hasDuplicates(variantNames)) {
      throw new ApiError(400, "All variant names must be unique.");
    }
  }

  const restaurant = req.restaurant;
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
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
  const existingFoodItem = await FoodItem.exists({
    restaurantId: restaurant._id,
    foodName: { $regex: foodName, $options: "i" }, // Case-insensitive search
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
    includeArchived = false,
    forPage = "", // Optional page filter
  } = req.query;

  let {
    category = "", // Optional category filter
    foodType = "", // Optional food type filter
    isAvailable = "", // Optional availability filter
  } = req.query;

  const pageNumber = parseInt(page.toString());
  const limitNumber = parseInt(limit.toString());
  const includeArchivedBoolean = includeArchived === "true";
  const user = req.user;

  if (pageNumber < 1 || limitNumber < 1) {
    throw new ApiError(400, "Page and limit must be positive integers");
  }

  const restaurant = await Restaurant.findOne({
    slug: req.params.restaurantSlug,
  }).lean();

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  if (
    includeArchivedBoolean ||
    restaurant.isArchived ||
    !restaurant.isCurrentlyOpen
  ) {
    if (!user) {
      throw new ApiError(403, "This restaurant is closed");
    }
    const isOwner = restaurant.ownerId?.toString() === user._id!.toString();
    const isStaff = restaurant.staffMembers?.some(
      (sm) => sm.user.toString() === user._id!.toString()
    );

    if (!isOwner && !isStaff) {
      throw new ApiError(403, "This restaurant is closed");
    }
    if (forPage === "order") {
      throw new ApiError(403, "Restaurant is closed");
    }
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

  const query: FilterQuery<typeof FoodItem> = {
    restaurantId: restaurant._id,
    ...(category ? { category } : {}), // Filter by category if provided
    ...(foodType ? { foodType } : {}), // Filter by food type if provided
    ...(isAvailable ? { isAvailable: isAvailable === "true" } : {}), // Filter by availability if provided
    ...(!includeArchivedBoolean && { isArchived: false }), // Filter archived items if not requested
  };

  if (decodedSearch) {
    query.$or = [
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
    ];
  }

  const foodItemCount = await FoodItem.countDocuments(query);

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
    const foodItems = await FoodItem.find(query)
      .sort({
        isAvailable: -1, // Sort by availability first (available items first)
        // Then sort by the specified field
        [sortBy.toString()]: sortType === "asc" ? 1 : -1, // Ascending or descending sort
      })
      .skip((pageNumber - 1) * limitNumber) // Pagination logic
      .limit(limitNumber) // Limit the number of results
      .select("-restaurantId -__v -tags -category -variants") // Exclude unnecessary fields
      .lean();

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
  if (!req.params || !req.params.foodItemId) {
    throw new ApiError(400, "Food item ID is required");
  }

  if (!isValidObjectId(req.params.foodItemId)) {
    throw new ApiError(400, "Invalid food item ID");
  }

  const foodItem = await FoodItem.findById(req.params.foodItemId)
    .select("-__v")
    .populate({
      path: "restaurantId",
      select: "name slug categories ownerId staffIds",
    })
    .lean();

  if (!foodItem) {
    throw new ApiError(404, "Food item not found");
  }

  // Check if restaurantId is populated and has a slug property
  if (
    !foodItem.restaurantId ||
    typeof foodItem.restaurantId !== "object" ||
    !("slug" in (foodItem.restaurantId as object)) ||
    (foodItem.restaurantId as unknown as { slug: string }).slug !==
      req.params.restaurantSlug
  ) {
    throw new ApiError(404, "Food item not found");
  }

  if (foodItem.isArchived) {
    const user = req.user;
    let isUserPartofRestaurant = false;

    if (user) {
      const restaurantDetails = foodItem.restaurantId as unknown as Restaurant;
      const isOwner =
        restaurantDetails.ownerId.toString() === user._id!.toString();
      const isStaff = restaurantDetails.staffMembers?.some(
        (sm) => sm.user.toString() === user._id!.toString()
      );

      if (isOwner || isStaff) {
        isUserPartofRestaurant = true;
      }
    }

    if (!isUserPartofRestaurant) {
      throw new ApiError(
        403,
        "You do not have permission to view this archived food item"
      );
    }
  }

  // Rename the populated field from restaurantId to restaurantDetails
  (foodItem as unknown as { restaurantDetails: unknown }).restaurantDetails =
    foodItem.restaurantId;
  delete (foodItem as unknown as { restaurantId: unknown }).restaurantId;

  res
    .status(200)
    .json(new ApiResponse(200, foodItem, "Food item fetched successfully"));
});

export const toggleFoodItemAvailability = asyncHandler(async (req, res) => {
  if (!req.params || !req.params.foodItemId) {
    throw new ApiError(400, "Food item ID is required");
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

  if (req.user!.restaurantIds!.length === 0) {
    throw new ApiError(
      403,
      "You do not have any restaurant associated with your account to update table status"
    );
  }

  if (req.restaurantRole !== "owner" && req.restaurantRole !== "staff") {
    throw new ApiError(
      403,
      "You do not have permission to toggle table status"
    );
  }

  const restaurant = req.restaurant;

  if (!restaurant || !restaurant._id) {
    throw new ApiError(404, "Restaurant not found");
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
  if (req.restaurantRole !== "owner") {
    throw new ApiError(403, "You are not authorized to update food items");
  }

  if (!req.params || !req.params.foodItemId) {
    throw new ApiError(400, "Food item ID is required");
  }

  if (!isValidObjectId(req.params.foodItemId)) {
    throw new ApiError(400, "Invalid food item ID");
  }

  const validatedData = foodItemSchema.parse(req.body);

  const restaurant = req.restaurant;
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
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
  } = validatedData;
  // Usage for tags
  if (tags && tags.length > 0 && hasDuplicates(tags)) {
    throw new ApiError(400, "all Tags must be unique.");
  }

  // Usage for variants (assuming each variant has a variantName property)
  if (variants && variants.length > 0) {
    const variantNames = variants.map(
      (v) => v.variantName?.trim().toLowerCase() || ""
    );
    if (hasDuplicates(variantNames)) {
      throw new ApiError(400, "All variant names must be unique.");
    }
  }
  if (foodName !== foodItem.foodName) {
    // Check if the food item with the same name already exists in the restaurant
    const existingFoodItem = await FoodItem.exists({
      restaurantId: restaurant._id,
      foodName: { $regex: foodName, $options: "i" }, // Case-insensitive search
      _id: { $ne: foodItem._id }, // Exclude the current food item from the check
    });

    if (existingFoodItem) {
      throw new ApiError(
        400,
        "Food item with this name already exists in the restaurant"
      );
    }
  }
  // Update the food item
  foodItem.foodName = foodName;
  foodItem.price = price;
  foodItem.discountedPrice = discountedPrice;
  foodItem.hasVariants = hasVariants;
  foodItem.variants = variants as FoodVariantType[];
  foodItem.imageUrls = imageUrls;
  foodItem.category = validatedData.category === "" ? undefined : category;
  foodItem.foodType = foodType;
  foodItem.description = description;
  foodItem.tags = tags;

  const updatedFoodItem = await foodItem.save();
  if (!updatedFoodItem) {
    throw new ApiError(500, "Failed to update food item");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedFoodItem, "Food item updated successfully")
    );
});

export const deleteFoodItem = asyncHandler(async (req, res) => {
  if (req.restaurantRole !== "owner") {
    throw new ApiError(403, "You are not authorized to delete food items");
  }

  if (!req.params || !req.params.foodItemId) {
    throw new ApiError(400, "Food item ID is required");
  }

  if (!isValidObjectId(req.params.foodItemId)) {
    throw new ApiError(400, "Invalid food item ID");
  }

  const restaurant = req.restaurant;
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
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
    await Promise.all(foodItem.imageUrls.map((url) => cloudinary.delete(url)));
  }

  await foodItem.deleteOne();

  res
    .status(200)
    .json(new ApiResponse(200, null, "Food item deleted successfully"));
});

export const toggleFoodItemArchiveStatus = asyncHandler(async (req, res) => {
  if (!req.params || !req.params.foodItemId) {
    throw new ApiError(400, "foodItemId is required");
  }
  const { foodItemId } = req.params;

  if (!isValidObjectId(foodItemId)) {
    throw new ApiError(400, "Invalid food item ID");
  }

  if (req.restaurantRole !== "owner") {
    throw new ApiError(
      403,
      "You do not have permission to toggle food item archive status"
    );
  }

  const restaurant = req.restaurant;

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
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
    await canUnarchiveFoodItem(restaurant.id, req.subscription);
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
