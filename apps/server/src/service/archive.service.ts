import { Restaurant } from "../models/restaurant.models.js";
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
    const excessCount = restaurants.length - limits.maxRestaurants;
    // We want to keep the first N (maxRestaurants), so we archive from index N onwards
    const restaurantsToArchive = restaurants.slice(limits.maxRestaurants);

    for (const rest of restaurantsToArchive) {
      rest.isArchived = true;
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
    // 2. Archive Excess Tables
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

    // 3. Archive Excess Food Items
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
  }
}
