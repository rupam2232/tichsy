import { NextFunction, Request, Response } from "express";
import { Restaurant } from "../models/restaurant.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Middleware to verify user's access to a specific restaurant.
 * Populates req.restaurant and req.restaurantRole ("owner", "staff", etc.).
 */
export const verifyRestaurantAccess = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1. Identify the restaurant
    const slug = req.params.slug || req.params.restaurantSlug;
    const headerId = req.headers["x-restaurant-id"];

    if (!slug && !headerId) {
      throw new ApiError(
        400,
        "Restaurant identifier (slug or x-restaurant-id) is required"
      );
    }

    const query: Record<string, string> = {};
    if (slug) {
      query.slug = slug;
    } else if (headerId) {
      query._id = headerId as string;
    }

    const restaurant = await Restaurant.findOne(query);
    if (!restaurant) {
      throw new ApiError(404, "Restaurant not found");
    }

    // 2. Check Authentication
    if (!req.user) {
      throw new ApiError(401, "Unauthorized request");
    }

    // 3. Determine Context Role
    let contextRole: string | null = null;
    const userIdStr = req.user._id.toString();

    if (restaurant.ownerId.toString() === userIdStr) {
      contextRole = "owner";
    } else {
      const staffMember = restaurant.staffMembers?.find(
        (sm) => sm.user.toString() === userIdStr
      );
      if (staffMember) {
        contextRole = staffMember.role;
      }
    }

    if (!contextRole) {
      throw new ApiError(403, "You do not have access to this restaurant");
    }

    // 4. Attach context to request
    req.restaurant = restaurant;
    req.restaurantRole = contextRole;

    next();
  }
);
