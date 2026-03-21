import { Restaurant } from "../models/restaurant.model.js";
import { RestaurantMember } from "../models/restaurantMember.model.js";
import { FoodItem } from "../models/foodItem.model.js";
import { Table } from "../models/table.model.js";
import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlan,
} from "../config/subscriptionPlans.js";
import { Types } from "mongoose";

/**
 * Archives resources that exceed the limits of the new plan.
 * Strategies:
 * - Restaurants: Keep oldest, archive newest.
 * - Tables: Keep oldest, archive newest (per restaurant).
 * - FoodItems: Keep oldest, archive newest (per restaurant).
 * - FoodItems with excess images/variants: Archive until user reduces.
 * - Staff: Keep oldest, archive newest (per restaurant).
 */
export async function archiveExcessResources(
  userId: string | Types.ObjectId,
  newPlan: SubscriptionPlan
) {
  const limits = SUBSCRIPTION_PLANS[newPlan];

  // 1. Archive Excess Restaurants
  // Fetch limits.maxRestaurants
  const restaurants = await Restaurant.find({
    ownerId: userId,
    isArchived: { $ne: true },
  }).sort({ createdAt: 1 }); // Oldest first

  if (restaurants.length > limits.maxRestaurants) {
    const restaurantsToArchive = restaurants.slice(limits.maxRestaurants);

    for (const rest of restaurantsToArchive) {
      rest.isArchived = true;
      rest.isCurrentlyOpen = false;
      rest.archivedAt = new Date();
      rest.archivedReason = `Downgrade to ${newPlan} plan`;
      await rest.save();
    }
  }

  // Reload restaurants to only process active ones for child entities
  const activeRestaurants = await Restaurant.find({
    ownerId: userId,
    isArchived: { $ne: true },
  });

  for (const restaurant of activeRestaurants) {
    // 2. Enforce Category Limit
    if (restaurant.categories.length > limits.maxCategoriesPerRestaurant) {
      restaurant.categories = restaurant.categories.slice(
        0,
        limits.maxCategoriesPerRestaurant
      );
      await restaurant.save();
    }

    // 3. Archive Excess Tables
    const tables = await Table.find({
      restaurantId: restaurant._id,
      isArchived: { $ne: true },
    }).sort({ createdAt: 1 });

    if (tables.length > limits.maxTablesPerRestaurant) {
      const tablesToArchive = tables.slice(limits.maxTablesPerRestaurant);
      for (const table of tablesToArchive) {
        table.isArchived = true;
        table.archivedAt = new Date();
        table.archivedReason = `Downgrade to ${newPlan} plan`;
        await table.save();
      }
    }

    // 4. Archive Excess Food Items (by count)
    const foodItems = await FoodItem.find({
      restaurantId: restaurant._id,
      isArchived: { $ne: true },
    }).sort({ createdAt: 1 });

    if (foodItems.length > limits.maxFoodItemsPerRestaurant) {
      const itemsToArchive = foodItems.slice(limits.maxFoodItemsPerRestaurant);
      for (const item of itemsToArchive) {
        item.isArchived = true;
        item.archivedAt = new Date();
        item.archivedReason = `Downgrade to ${newPlan} plan`;
        await item.save();
      }
    }

    // 5. Archive Food Items with excess images or variants
    const activeFoodItems = await FoodItem.find({
      restaurantId: restaurant._id,
      isArchived: { $ne: true },
    });

    for (const item of activeFoodItems) {
      const hasExcessImages =
        (item.imageUrls?.length || 0) > limits.maxImagesPerFoodItem;
      const hasExcessVariants =
        (item.variants?.length || 0) > limits.maxVariantsPerFoodItem;

      if (hasExcessImages || hasExcessVariants) {
        const reasons: string[] = [];
        if (hasExcessImages) {
          reasons.push(
            `${item.imageUrls?.length} images exceeds limit of ${limits.maxImagesPerFoodItem}`
          );
        }
        if (hasExcessVariants) {
          reasons.push(
            `${item.variants?.length} variants exceeds limit of ${limits.maxVariantsPerFoodItem}`
          );
        }

        item.isArchived = true;
        item.archivedAt = new Date();
        item.archivedReason = `Downgrade to ${newPlan} plan: ${reasons.join(", ")}. Remove excess to unarchive.`;
        await item.save();
      }
    }

    // 6. Archive Excess Staff Members (using RestaurantMember model)
    const activeStaffCount = await RestaurantMember.countDocuments({
      restaurantId: restaurant._id,
      isArchived: false,
    });

    if (activeStaffCount > limits.maxStaffPerRestaurant) {
      // Find active staff sorted by joinedAt (oldest first) to archive newest ones
      const staffToArchive = await RestaurantMember.find({
        restaurantId: restaurant._id,
        isArchived: false,
      })
        .sort({ joinedAt: 1 }) // Oldest first
        .skip(limits.maxStaffPerRestaurant) // Skip the ones we keep
        .select("_id");

      if (staffToArchive.length > 0) {
        await RestaurantMember.updateMany(
          {
            _id: { $in: staffToArchive.map((s) => s._id) },
          },
          {
            $set: {
              isArchived: true,
              archivedAt: new Date(),
              archivedReason: `Downgrade to ${newPlan} plan`,
            },
          }
        );
      }
    }
  }
}
