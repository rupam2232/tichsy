import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Restaurant } from "../models/restaurant.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { isValidObjectId, Types } from "mongoose";
import { Cart, CartItem } from "../models/cart.model.js";
import { FoodItem } from "../models/foodItem.model.js";
import { getCookieOptions } from "../utils/cookieOptions.js";
import {
  addToCartSchema,
  removeFromCartSchema,
  updateCartItemSchema,
} from "@repo/types";
const options = getCookieOptions();

export const addToCart = asyncHandler(async (req, res) => {
  const validatedData = addToCartSchema.parse(req.body);
  const { foodId, quantity, variantName } = validatedData;
  if (!req.params || !req.params.restaurantSlug) {
    throw new ApiError(400, "Restaurant slug is required");
  }
  const restaurantSlug = req.params.restaurantSlug;

  if (!isValidObjectId(foodId)) {
    throw new ApiError(400, "Invalid food ID");
  }

  if (isNaN(quantity)) {
    throw new ApiError(400, "Invalid quantity");
  }

  const restaurant = await Restaurant.findOne({ slug: restaurantSlug });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  if (!restaurant.isCurrentlyOpen) {
    throw new ApiError(400, "Restaurant is currently closed");
  }

  if (restaurant.isArchived) {
    throw new ApiError(
      403,
      "Restaurant is archived. Please contact staff or try again later."
    );
  }

  if (quantity <= 0) {
    throw new ApiError(400, "Quantity must be greater than zero");
  }

  // Check if the food item exists in the restaurant's menu
  const foodItem = await FoodItem.findOne({
    _id: foodId,
    restaurantId: restaurant._id,
  });

  if (!foodItem) {
    throw new ApiError(404, "Food item not found");
  } else if (!foodItem.isAvailable && !variantName) {
    throw new ApiError(400, "Food item is not available");
  } else if (!foodItem.hasVariants && variantName) {
    throw new ApiError(400, "Variant name is not allowed for this food item");
  } else if (
    foodItem.hasVariants &&
    variantName &&
    (!foodItem.variants ||
      !foodItem.variants.some((variant) => variant.variantName === variantName))
  ) {
    throw new ApiError(400, "Invalid variant name for this food item");
  } else if (
    variantName &&
    foodItem.variants.some(
      (variant) => variant.variantName === variantName && !variant.isAvailable
    )
  ) {
    throw new ApiError(400, "Food item is not available");
  }

  let cart = null;

  if (req.cookies && req.cookies.cartId) {
    cart = await Cart.findById(req.cookies.cartId);
  }

  if (!cart) {
    cart = await Cart.create({
      items: [{ foodId, quantity, variantName, restaurantSlug }],
    });
  } else {
    const existingItem = cart.items.find(
      (item) =>
        item.foodId.equals(foodId) &&
        item.restaurantSlug === restaurantSlug &&
        item.variantName === variantName // Ensure variantName matches if provided
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        foodId,
        quantity,
        variantName,
        restaurantSlug,
      } as unknown as CartItem);
    }
    cart.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Reset expiration date
    await cart.save();
  }

  res
    .status(200)
    .cookie("cartId", cart._id, {
      ...options,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json(new ApiResponse(200, cart.items, "Item added to cart"));
});

export const removeFromCart = asyncHandler(async (req, res) => {
  if (!req.params || !req.params.restaurantSlug || !req.params.foodId) {
    throw new ApiError(400, "Food ID and restaurant slug are required");
  }

  const validatedData = removeFromCartSchema.parse(req.body);
  const { quantity, variantName } = validatedData;

  const { foodId, restaurantSlug } = req.params;

  if (!isValidObjectId(foodId)) {
    throw new ApiError(400, "Invalid food ID");
  }

  let cart = null;

  if (req.cookies && req.cookies.cartId) {
    cart = await Cart.findById(req.cookies.cartId);
  }

  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const itemIndex = cart.items.findIndex(
    (item) =>
      item.foodId.equals(foodId) &&
      item.restaurantSlug === restaurantSlug &&
      (variantName
        ? item.variantName === variantName
        : item.variantName === null) // Ensure variantName matches if provided
  );

  if (itemIndex === -1) {
    throw new ApiError(404, "Item not found in cart");
  }

  if (cart.items[itemIndex].quantity > quantity) {
    cart.items[itemIndex].quantity -= quantity; // Decrease quantity by the specified amount
  } else {
    cart.items.splice(itemIndex, 1);
  }
  cart.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Reset expiration date

  await cart.save();

  res
    .status(200)
    .cookie("cartId", cart._id, {
      ...options,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json(new ApiResponse(200, cart.items, "Item removed from cart"));
});

export const updateCartItem = asyncHandler(async (req, res) => {
  if (!req.params || !req.params.restaurantSlug || !req.params.foodId) {
    throw new ApiError(400, "Food ID and restaurant slug are required");
  }

  const validatedData = updateCartItemSchema.parse(req.body);
  const { quantity, variantName } = validatedData;

  const { foodId, restaurantSlug } = req.params;

  if (!isValidObjectId(foodId)) {
    throw new ApiError(400, "Invalid food ID");
  }

  let cart = null;

  if (req.cookies && req.cookies.cartId) {
    cart = await Cart.findById(req.cookies.cartId);
  }

  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const itemIndex = cart.items.findIndex(
    (item) =>
      item.foodId.equals(foodId) &&
      item.restaurantSlug === restaurantSlug &&
      (variantName
        ? item.variantName === variantName
        : item.variantName === null) // Ensure variantName matches if provided
  );

  if (itemIndex === -1) {
    throw new ApiError(404, "Item not found in cart");
  }

  const restaurant = await Restaurant.findOne({ slug: restaurantSlug });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  if (!restaurant.isCurrentlyOpen) {
    throw new ApiError(400, "Restaurant is currently closed");
  }

  // Check if the food item exists in the restaurant's menu
  const foodItem = await FoodItem.findOne({
    _id: foodId,
    restaurantId: restaurant._id,
  });

  if (!foodItem) {
    throw new ApiError(404, "Food item not found");
  } else if (!foodItem.isAvailable && !variantName) {
    throw new ApiError(400, "Food item is not available");
  } else if (!foodItem.hasVariants && variantName) {
    throw new ApiError(400, "Variant name is not allowed for this food item");
  } else if (
    foodItem.hasVariants &&
    variantName &&
    (!foodItem.variants ||
      !foodItem.variants.some((variant) => variant.variantName === variantName))
  ) {
    throw new ApiError(400, "Invalid variant name for this food item");
  } else if (
    variantName &&
    foodItem.variants.some(
      (variant) => variant.variantName === variantName && !variant.isAvailable
    )
  ) {
    throw new ApiError(400, "Food item is not available");
  }

  cart.items[itemIndex].quantity = quantity;
  cart.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Reset expiration date
  await cart.save();

  res
    .status(200)
    .cookie("cartId", cart._id, {
      ...options,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json(new ApiResponse(200, cart.items, "Cart item updated"));
});

export const clearCart = asyncHandler(async (req, res) => {
  if (!req.params || !req.params.restaurantSlug) {
    throw new ApiError(400, "Restaurant slug is required");
  }
  let cart = null;

  if (req.cookies && req.cookies.cartId) {
    cart = await Cart.findById(req.cookies.cartId);
  }

  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  cart.items = cart.items.filter(
    (item) => item.restaurantSlug !== req.params.restaurantSlug
  );
  cart.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Reset expiration date
  await cart.save();

  res
    .status(200)
    .cookie("cartId", cart._id, {
      ...options,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json(new ApiResponse(200, cart.items, "Cart cleared"));
});

export const getCartItems = asyncHandler(async (req, res) => {
  if (!req.params || !req.params.restaurantSlug) {
    throw new ApiError(400, "Restaurant slug is required");
  }

  const restaurantSlug = req.params.restaurantSlug;
  let cart = null;

  if (req.cookies && req.cookies.cartId) {
    cart = await Cart.aggregate([
      {
        $match: { _id: new Types.ObjectId(req.cookies.cartId) },
      },
      {
        $lookup: {
          from: "restaurants",
          localField: "items.restaurantSlug",
          foreignField: "slug",
          as: "restaurantDetails",
        },
      },
      {
        $unwind: { path: "$items", preserveNullAndEmptyArrays: false },
      },
      {
        $match: { "items.restaurantSlug": restaurantSlug },
      },
      {
        $lookup: {
          from: "fooditems",
          localField: "items.foodId",
          foreignField: "_id",
          as: "foodDetails",
        },
      },
      {
        $unwind: { path: "$foodDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $addFields: {
          "items.foodName": "$foodDetails.foodName",
          "items.imageUrl": { $arrayElemAt: ["$foodDetails.imageUrls", 0] },
          "items.foodType": "$foodDetails.foodType",
          "items.price": {
            $cond: [
              {
                $and: [
                  { $gt: [{ $size: "$foodDetails.variants" }, 0] },
                  { $ifNull: ["$items.variantName", false] },
                ],
              },
              {
                $let: {
                  vars: {
                    variant: {
                      $arrayElemAt: [
                        "$foodDetails.variants",
                        {
                          $indexOfArray: [
                            "$foodDetails.variants.variantName",
                            "$items.variantName",
                          ],
                        },
                      ],
                    },
                  },
                  in: "$$variant.price",
                },
              },
              "$foodDetails.price",
            ],
          },
          "items.discountedPrice": {
            $cond: [
              {
                $and: [
                  { $gt: [{ $size: "$foodDetails.variants" }, 0] },
                  { $ifNull: ["$items.variantName", false] },
                ],
              },
              {
                $let: {
                  vars: {
                    variant: {
                      $arrayElemAt: [
                        "$foodDetails.variants",
                        {
                          $indexOfArray: [
                            "$foodDetails.variants.variantName",
                            "$items.variantName",
                          ],
                        },
                      ],
                    },
                  },
                  in: "$$variant.discountedPrice",
                },
              },
              "$foodDetails.discountedPrice",
            ],
          },
          "items.isAvailable": {
            $cond: [
              {
                $and: [
                  { $gt: [{ $size: "$foodDetails.variants" }, 0] },
                  { $ifNull: ["$items.variantName", false] },
                ],
              },
              {
                $let: {
                  vars: {
                    variant: {
                      $arrayElemAt: [
                        "$foodDetails.variants",
                        {
                          $indexOfArray: [
                            "$foodDetails.variants.variantName",
                            "$items.variantName",
                          ],
                        },
                      ],
                    },
                  },
                  in: "$$variant.isAvailable",
                },
              },
              "$foodDetails.isAvailable",
            ],
          },
          "items.description": {
            $cond: [
              {
                $and: [
                  { $gt: [{ $size: "$foodDetails.variants" }, 0] },
                  { $ifNull: ["$items.variantName", false] },
                ],
              },
              {
                $let: {
                  vars: {
                    variant: {
                      $arrayElemAt: [
                        "$foodDetails.variants",
                        {
                          $indexOfArray: [
                            "$foodDetails.variants.variantName",
                            "$items.variantName",
                          ],
                        },
                      ],
                    },
                  },
                  in: "$$variant.description",
                },
              },
              "$foodDetails.description",
            ],
          },
          "taxDetails.taxRate": "$restaurantDetails.taxRate",
          "taxDetails.taxLabel": "$restaurantDetails.taxLabel",
          "taxDetails.isTaxIncludedInPrice":
            "$restaurantDetails.isTaxIncludedInPrice",
        },
      },
      {
        $group: {
          _id: "$_id",
          items: { $push: "$items" },
          taxDetails: {
            $first: {
              taxRate: { $first: "$restaurantDetails.taxRate" },
              taxLabel: { $first: "$restaurantDetails.taxLabel" },
              isTaxIncludedInPrice: {
                $first: "$restaurantDetails.isTaxIncludedInPrice",
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          taxDetails: 1,
          items: 1,
        },
      },
    ]).exec();
  }

  if (!cart || cart.length === 0 || !cart[0].items) {
    res.status(200).json(new ApiResponse(200, [], "Cart is empty"));
  } else {
    Cart.findByIdAndUpdate(cart[0]._id, {
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Reset expiration date
    }).exec();
    res
      .status(200)
      .cookie("cartId", cart[0]._id, {
        ...options,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json(new ApiResponse(200, cart[0], "Cart items retrieved"));
  }
});
