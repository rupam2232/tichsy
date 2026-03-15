import crypto from "crypto";
import { Restaurant } from "../models/restaurant.model.js";
import { Table } from "../models/table.model.js";
import { canCreateTable, canUnarchiveTable } from "../service/table.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Order } from "../models/order.model.js";
import { tableSchema } from "@repo/types";

export const createTable = asyncHandler(async (req, res) => {
  if (!req.body || !req.body.tableName) {
    throw new ApiError(400, "tableName is required");
  }

  const validatedData = tableSchema.parse(req.body);
  const { tableName, seatCount } = validatedData;

  if (req.restaurantRole !== "owner") {
    throw new ApiError(403, "You do not have permission to create a table");
  }

  if (req.user!.restaurantIds!.length === 0) {
    throw new ApiError(
      403,
      "You do not have any restaurants to create a table for"
    );
  }

  if (seatCount && (Math.ceil(seatCount) < 1 || Math.ceil(seatCount) > 40)) {
    throw new ApiError(400, "Seat count must be between 1 and 40");
  }

  const restaurant = req.restaurant;
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  if (restaurant.isArchived) {
    throw new ApiError(
      403,
      "Restaurant is archived. Please unarchive restaurant to create a table"
    );
  }

  const restaurantId = restaurant._id!.toString();
  await canCreateTable(req.subscription!, restaurantId);

  const existingTable = await Table.exists({
    restaurantId,
    tableName: { $regex: tableName, $options: "i" },
  });

  if (existingTable) {
    throw new ApiError(
      400,
      "Table with this name already exists in the restaurant"
    );
  }

  // Try to create a unique qrSlug, retry if duplicate key error
  let table;
  let attempts = 0;
  const maxAttempts = 5;
  while (attempts < maxAttempts) {
    try {
      const qrSlug = `${restaurantId.slice(-4)}-${crypto.randomBytes(2).toString("hex")}`;
      table = await Table.create({
        restaurantId,
        tableName,
        qrSlug,
        seatCount: seatCount ? Math.ceil(seatCount) : 1,
      });
      break; // Success, exit loop
    } catch (err: unknown) {
      // 11000 is MongoDB duplicate key error code
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        err.code === 11000 &&
        "keyPattern" in err &&
        err.keyPattern &&
        typeof err.keyPattern === "object" &&
        "qrSlug" in err.keyPattern
      ) {
        attempts++;
        // Try again with a new qrSlug
        continue;
      }
      // Other errors, rethrow
      throw err;
    }
  }

  if (!table) {
    throw new ApiError(500, "Failed to create table. Please try again");
  }
  res
    .status(201)
    .json(new ApiResponse(201, table, "Table created successfully"));
});

export const updateTable = asyncHandler(async (req, res) => {
  if (!req.params.qrSlug) {
    throw new ApiError(400, "qrSlug is required");
  }
  const qrSlug = req.params.qrSlug;

  const validatedData = tableSchema.parse(req.body);
  const { tableName, seatCount } = validatedData;

  const user = req.user;

  if (req.restaurantRole !== "owner") {
    throw new ApiError(403, "You do not have permission to update a table");
  }

  if (user!.restaurantIds!.length === 0) {
    throw new ApiError(
      403,
      "You do not have any restaurants to update a table for"
    );
  }

  if (seatCount && (Math.ceil(seatCount) < 1 || Math.ceil(seatCount) > 40)) {
    throw new ApiError(400, "Seat count must be between 1 and 40");
  }

  const restaurant = req.restaurant;

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  if (restaurant.isArchived) {
    throw new ApiError(
      403,
      "Restaurant is archived. Please unarchive restaurant to update table."
    );
  }

  const table = await Table.findOne({ qrSlug, restaurantId: restaurant?._id });

  if (!table) {
    throw new ApiError(404, "Table not found or you do not own this table");
  }

  if (table.isArchived) {
    throw new ApiError(403, "Cannot make changes in a archived table");
  }

  table.tableName = tableName;
  table.seatCount = Math.ceil(seatCount || table.seatCount);
  await table.save();

  const [totalTables, availableTables, occupiedTables, archivedTables] =
    await Promise.all([
      Table.countDocuments({ restaurantId: restaurant._id }),
      Table.countDocuments({
        restaurantId: restaurant._id,
        isOccupied: false,
        isArchived: false,
      }),
      Table.countDocuments({
        restaurantId: restaurant._id,
        isOccupied: true,
        isArchived: false,
      }),
      Table.countDocuments({ restaurantId: restaurant._id, isArchived: true }),
    ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        table,
        totalCount: totalTables,
        availableTables,
        occupiedTables,
        archivedTables,
      },
      "Table updated successfully"
    )
  );
});

export const toggleOccupiedStatus = asyncHandler(async (req, res) => {
  if (!req.params.qrSlug) {
    throw new ApiError(400, "qrSlug is required");
  }
  const qrSlug = req.params.qrSlug;

  const user = req.user;

  if (user!.restaurantIds!.length === 0) {
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
    throw new ApiError(
      404,
      "Restaurant not found or you do not have permission to toggle table status"
    );
  }

  if (restaurant.isArchived) {
    throw new ApiError(
      403,
      "Restaurant is archived. Please unarchive restaurant to toggle occupied status."
    );
  }

  // Check if the table exists and belongs to the user's restaurant
  const table = await Table.findOne({
    qrSlug,
    restaurantId: restaurant._id,
  });

  if (!table) {
    throw new ApiError(
      404,
      "Table not found or you do not have permission to update this table"
    );
  }

  if (table.isArchived) {
    throw new ApiError(
      400,
      "Cannot toggle occupied status of an archived table"
    );
  }

  if (table.isOccupied && table.currentOrderId) {
    const order = await Order.findById(table.currentOrderId).lean();
    if (order && !["completed", "cancelled"].includes(order.status)) {
      throw new ApiError(
        400,
        "Cannot toggle occupied status while an order is active"
      );
    } else {
      table.currentOrderId = undefined;
    }
  }

  table.isOccupied = !table.isOccupied;
  await table.save();

  const [totalTables, availableTables, occupiedTables, archivedTables] =
    await Promise.all([
      Table.countDocuments({ restaurantId: restaurant._id }),
      Table.countDocuments({
        restaurantId: restaurant._id,
        isOccupied: false,
        isArchived: false,
      }),
      Table.countDocuments({
        restaurantId: restaurant._id,
        isOccupied: true,
        isArchived: false,
      }),
      Table.countDocuments({ restaurantId: restaurant._id, isArchived: true }),
    ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        table,
        totalCount: totalTables,
        availableTables,
        occupiedTables,
        archivedTables,
      },
      "Table occupied status updated successfully"
    )
  );
});

export const getTableBySlug = asyncHandler(async (req, res) => {
  if (!req.params || !req.params.qrSlug || !req.params.restaurantSlug) {
    throw new ApiError(400, "qr slug and restaurant slug is required");
  }
  const { qrSlug, restaurantSlug } = req.params;
  const restaurant = await Restaurant.findOne({ slug: restaurantSlug });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  let isUserPartofRestaurant = false;
  if (req.user) {
    // If user is authenticated, check if they are the owner or staff of the restaurant
    const isOwner = restaurant.ownerId.toString() === req.user._id!.toString();
    const isStaff = restaurant.staffMembers?.some(
      (sm) => sm.user.toString() === req.user!._id!.toString()
    );

    if (isOwner || isStaff) {
      isUserPartofRestaurant = true;
    }
  }

  const table = await Table.aggregate([
    {
      $match: {
        qrSlug,
        restaurantId: restaurant._id,
      },
    },
    {
      $lookup: {
        from: "restaurants",
        localField: "restaurantId",
        foreignField: "_id",
        as: "restaurantDetails",
      },
    },
    { $unwind: "$restaurantDetails" },
    {
      $lookup: {
        from: "orders",
        localField: "currentOrderId",
        foreignField: "_id",
        as: "currentOrder",
      },
    },
    {
      $unwind: {
        path: "$currentOrder",
        preserveNullAndEmptyArrays: true, // In case there's no current order
      },
    },
    {
      $project: {
        tableName: 1,
        seatCount: 1,
        isOccupied: 1,
        qrSlug: 1,
        currentOrderId: 1,
        isArchived: 1,
        archivedAt: 1,
        archivedReason: 1,
        createdAt: 1,
        currentOrder: isUserPartofRestaurant
          ? {
              orderId: "$currentOrder._id",
              orderNo: "$currentOrder.orderNo",
              status: "$currentOrder.status",
              finalAmount: "$currentOrder.totalAmount",
              foodItems: "$currentOrder.foodItems",
              createdAt: "$currentOrder.createdAt",
              updatedAt: "$currentOrder.updatedAt",
            }
          : "$$REMOVE",
        restaurantDetails: {
          restaurantName: "$restaurantDetails.restaurantName",
          address: "$restaurantDetails.address",
          slug: "$restaurantDetails.slug",
          logoUrl: "$restaurantDetails.logoUrl",
        },
      },
    },
  ]);

  if (!table || table.length === 0) {
    throw new ApiError(404, "Table not found");
  }

  if (table[0].isArchived && !isUserPartofRestaurant) {
    throw new ApiError(404, "Table not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, table[0], "Table details fetched successfully"));
});

export const getAllTablesOfRestaurant = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = "asc",
    includeArchived = false,
  } = req.query;

  const pageNumber = parseInt(page.toString());
  const limitNumber = parseInt(limit.toString());
  const includeArchivedBoolean = includeArchived === "true";

  if (pageNumber < 1 || limitNumber < 1) {
    throw new ApiError(400, "Page and limit must be positive integers");
  }

  const restaurant = req.restaurant;
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  const tableCount = await Table.countDocuments({
    restaurantId: restaurant._id,
    ...(!includeArchivedBoolean && { isArchived: false }),
  });

  if (!tableCount || tableCount === 0) {
    res.status(200).json(
      new ApiResponse(
        200,
        {
          tables: [],
          page: pageNumber,
          limit: limitNumber,
          totalPages: 0,
          totalCount: 0,
          availableTables: 0,
          occupiedTables: 0,
          archivedTables: 0,
        },
        "No tables found"
      )
    );
  } else {
    const [tables, availableTables, occupiedTables, archivedTables] =
      await Promise.all([
        Table.find({
          restaurantId: restaurant._id,
          ...(!includeArchivedBoolean && { isArchived: false }),
        })
          .sort({
            [sortBy.toString()]: sortType === "asc" ? 1 : -1, // Ascending or descending sort
          })
          .skip((pageNumber - 1) * limitNumber) // Pagination logic
          .limit(limitNumber) // Limit the number of results
          .select("-restaurantId -__v"), // Exclude restaurantId and __v fields
        Table.countDocuments({
          restaurantId: restaurant._id,
          isOccupied: false,
          isArchived: false,
        }),
        Table.countDocuments({
          restaurantId: restaurant._id,
          isOccupied: true,
          isArchived: false,
        }),
        Table.countDocuments({
          restaurantId: restaurant._id,
          isArchived: true,
        }),
      ]);
    const totalPages = Math.ceil(tableCount / limitNumber);
    res
      .status(200)
      .setHeader("X-Total-Count", tableCount.toString())
      .setHeader("X-Total-Pages", totalPages.toString())
      .json(
        new ApiResponse(
          200,
          {
            tables,
            page: pageNumber,
            limit: limitNumber,
            totalPages,
            totalCount: tableCount,
            availableTables,
            occupiedTables,
            archivedTables,
          },
          "Tables fetched successfully"
        )
      );
  }
});

export const deleteTable = asyncHandler(async (req, res) => {
  if (!req.params.qrSlug) {
    throw new ApiError(400, "qrSlug is required");
  }
  const qrSlug = req.params.qrSlug;

  if (req.restaurantRole !== "owner") {
    throw new ApiError(403, "You do not have permission to delete a table");
  }

  const restaurant = req.restaurant;

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  if (restaurant.isArchived) {
    throw new ApiError(
      403,
      "Restaurant is archived. Please unarchive restaurant to delete table."
    );
  }

  const table = await Table.findOneAndDelete({
    qrSlug,
    restaurantId: restaurant._id,
  }).lean();

  if (!table) {
    throw new ApiError(404, "Table not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, null, "Table deleted successfully"));
});

export const toggleTableArchiveStatus = asyncHandler(async (req, res) => {
  if (!req.params.qrSlug) {
    throw new ApiError(400, "qrSlug is required");
  }
  const { qrSlug } = req.params;

  if (req.restaurantRole !== "owner") {
    throw new ApiError(
      403,
      "You do not have permission to toggle table archive status"
    );
  }

  const restaurant = req.restaurant;

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  if (restaurant.isArchived) {
    throw new ApiError(
      403,
      "Restaurant is archived. Please unarchive restaurant to toggle table archive status"
    );
  }

  const table = await Table.findOne({
    qrSlug,
    restaurantId: restaurant._id,
  });

  if (!table) {
    throw new ApiError(404, "Table not found");
  }

  // If unarchiving, check subscription limits
  if (table.isArchived) {
    await canUnarchiveTable(restaurant.id, req.subscription);
    table.isArchived = false;
    table.archivedAt = undefined;
    table.archivedReason = undefined;
  } else {
    // Archiving is always allowed manually
    table.isArchived = true;
    table.archivedAt = new Date();
    table.archivedReason = req.body?.archivedReason ?? "Archived by owner";
  }

  await table.save();

  const [totalTables, availableTables, occupiedTables, archivedTables] =
    await Promise.all([
      Table.countDocuments({
        restaurantId: restaurant._id,
      }),
      Table.countDocuments({
        restaurantId: restaurant._id,
        isOccupied: false,
        isArchived: false,
      }),
      Table.countDocuments({
        restaurantId: restaurant._id,
        isOccupied: true,
        isArchived: false,
      }),
      Table.countDocuments({
        restaurantId: restaurant._id,
        isArchived: true,
      }),
    ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        table,
        totalCount: totalTables,
        availableTables,
        occupiedTables,
        archivedTables,
      },
      "Table archive status toggled successfully"
    )
  );
});
