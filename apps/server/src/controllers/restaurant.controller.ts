import path from "path";
import fs from "fs";
import cloudinary from "../utils/cloudinary.js";
import { Restaurant } from "../models/restaurant.model.js";
import { Types } from "mongoose";
import {
  canAddCategory,
  canCreateRestaurant,
  canToggleOpeningStatus,
  canUnarchiveRestaurant,
} from "../service/restaurant.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { restaurantCreatedTemplate } from "../templates/emailTemplates.js";
import sendEmail from "../utils/sendEmail.js";
import { Order } from "../models/order.model.js";
import { Table } from "../models/table.model.js";
import { startOfDay, endOfDay, startOfMonth, subMonths } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import {
  createRestaurantSchema,
  updateRestaurantSchema,
  addCategorySchema,
} from "@repo/types";
import { FoodItem } from "../models/foodItem.model.js";

const getRestaurantProfile = (restaurant: Restaurant) => {
  return {
    _id: restaurant._id,
    restaurantName: restaurant.restaurantName,
    slug: restaurant.slug,
    description: restaurant.description,
    address: restaurant.address,
    logoUrl: restaurant.logoUrl,
    isCurrentlyOpen: restaurant.isCurrentlyOpen,
    isArchived: restaurant.isArchived,
    categories: restaurant.categories,
    ownerId: restaurant.ownerId,
    taxRate: restaurant.taxRate,
    taxLabel: restaurant.taxLabel,
    isTaxIncludedInPrice: restaurant.isTaxIncludedInPrice,
  };
};

export const createRestaurant = asyncHandler(async (req, res) => {
  const validatedData = createRestaurantSchema.parse(req.body);
  const { restaurantName, slug, description, address, logoUrl } = validatedData;
  const ownerId = req.user!._id;

  // Owner check is dynamically determined based on the restaurant's ownerId

  await canCreateRestaurant(req.user!, req.subscription!);

  // Check if the restaurant already exists
  const existingRestaurant = await Restaurant.exists({
    $or: [
      { slug },
      {
        restaurantName: { $regex: new RegExp(`^${restaurantName}$`, "i") },
        ownerId: { $ne: ownerId },
      },
    ],
  });

  if (existingRestaurant) {
    throw new ApiError(
      400,
      `Restaurant with slug ${slug} or name ${restaurantName} already exists`
    );
  }

  const restaurant = await Restaurant.create({
    restaurantName,
    slug,
    description,
    address,
    ownerId,
    logoUrl,
  });
  if (!restaurant) {
    throw new ApiError(500, "Failed to create restaurant.");
  }

  req.user!.restaurantIds!.push(restaurant._id as Types.ObjectId);
  // Ensure the restaurantIds array is unique
  req.user!.restaurantIds = Array.from(new Set(req.user!.restaurantIds));
  // Save the user without validation to avoid triggering validation errors
  await req.user!.save({ validateBeforeSave: false });

  sendEmail(
    req.user!.email,
    "restaurant-created",
    restaurantCreatedTemplate(
      req.user!.firstName ?? "User",
      restaurant.restaurantName,
      restaurant.slug,
      restaurant.description ?? "Not defined",
      restaurant.address ?? "Not defined"
    )
  );
  res
    .status(201)
    .json(new ApiResponse(201, restaurant, "Restaurant created successfully"));
});

export const getOwnedRestaurants = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const [restaurants, totalCount] = await Promise.all([
    Restaurant.find({ ownerId: req.user!._id })
      .select(
        "_id restaurantName slug description address logoUrl isCurrentlyOpen isArchived"
      )
      .skip(skip)
      .limit(limit)
      .lean(),
    Restaurant.countDocuments({ ownerId: req.user!._id }),
  ]);

  const hasNextPage = skip + restaurants.length < totalCount;

  res.status(200).json(
    new ApiResponse(
      200,
      {
        restaurants,
        hasNextPage,
        page,
        limit,
      },
      "Owned restaurants fetched successfully"
    )
  );
});

export const getJoinedRestaurants = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const [restaurants, totalCount] = await Promise.all([
    Restaurant.find({ "staffMembers.user": req.user!._id })
      .select(
        "_id restaurantName slug description address logoUrl isCurrentlyOpen isArchived"
      )
      .skip(skip)
      .limit(limit)
      .lean(),
    Restaurant.countDocuments({ "staffMembers.user": req.user!._id }),
  ]);

  const hasNextPage = skip + restaurants.length < totalCount;

  res.status(200).json(
    new ApiResponse(
      200,
      {
        restaurants,
        hasNextPage,
        page,
        limit,
      },
      "Joined restaurants fetched successfully"
    )
  );
});

export const getRestaurantBySlug = asyncHandler(async (req, res) => {
  if (!req.params?.slug) {
    throw new ApiError(400, "Restaurant slug is required.");
  }
  const { slug } = req.params;

  const slugSchema = createRestaurantSchema.shape.slug;
  const result = slugSchema.safeParse(slug);
  if (!result.success) {
    throw result.error;
  }

  const { forMetaData = "false" } = req.query;
  const isForMetaData = forMetaData === "true";

  // Fetch with minimal hidden fields first
  const selectFields = "-__v -updatedAt";
  const restaurant = await Restaurant.findOne({ slug })
    .select(selectFields)
    .lean();

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found.");
  }

  let userRole: string | undefined = undefined;

  // Determine user context role if provided an auth token
  if (req.user) {
    if (restaurant.ownerId.toString() === req.user.id) {
      userRole = "owner";
    } else {
      const staffMember = restaurant.staffMembers?.find(
        (sm) => sm.user.toString() === req.user!.id
      );
      if (staffMember) {
        userRole = staffMember.role;
      }
    }
  }

  // Authorization Check
  if (!isForMetaData) {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized request");
    }
    if (!userRole) {
      throw new ApiError(403, "You do not have access to this restaurant");
    }
  }

  // Data Stripping Logic
  // If the request isn't coming from an owner, aggressively strip all non-minimal data
  let responsePayload = { ...restaurant, userRole };

  if (userRole !== "owner") {
    // Exclude full data scope (e.g staffMembers, sensitive tokens, unneeded fields)
    const {
      staffMembers,
      ownerId,
      taxRate,
      taxLabel,
      isTaxIncludedInPrice,
      createdAt,
      archivedAt,
      archivedReason,
      ...minimalInfo
    } = responsePayload;

    void staffMembers;
    void ownerId;
    void taxRate;
    void taxLabel;
    void isTaxIncludedInPrice;
    void createdAt;
    void archivedAt;
    void archivedReason;

    responsePayload = minimalInfo as typeof responsePayload;
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, responsePayload, "Restaurant fetched successfully")
    );
});

export const updateRestaurantDetails = asyncHandler(async (req, res) => {
  if (!req.params || !req.params.slug) {
    throw new ApiError(400, "Restaurant slug is required");
  }
  const { slug } = req.params;

  const validatedData = updateRestaurantSchema.parse(req.body);

  const {
    restaurantName,
    newSlug,
    description,
    address,
    logoUrl,
    categories,
    openingTime,
    closingTime,
  } = validatedData;

  if (closingTime || openingTime) {
    if (!openingTime || !closingTime) {
      throw new ApiError(
        400,
        "Both opening and closing times must be provided or neither"
      );
    }
  }

  const restaurant = await Restaurant.findOne({
    slug,
    ownerId: req.user!._id,
  }).select("-staffIds -__v -updatedAt");

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  if (slug !== newSlug) {
    const duplicateRestaurantSlug = await Restaurant.exists({
      slug: newSlug,
    });
    if (duplicateRestaurantSlug) {
      throw new ApiError(400, "Slug is already taken");
    }
  }

  if (restaurant.ownerId.toString() !== req.user!._id!.toString()) {
    throw new ApiError(403, "You are not the owner of this restaurant");
  }

  if (restaurant.isArchived) {
    throw new ApiError(
      403,
      "Restaurant is archived. Please unarchive restaurant to update details."
    );
  }

  if (restaurant.restaurantName !== restaurantName) {
    const duplicateRestaurantName = await Restaurant.exists({
      restaurantName,
      ownerId: req.user!._id,
      _id: { $ne: restaurant._id },
    });
    if (duplicateRestaurantName) {
      throw new ApiError(400, "Restaurant name is already taken");
    }
  }

  if (restaurant.slug !== newSlug) restaurant.slug = newSlug;
  restaurant.restaurantName = restaurantName;
  restaurant.description = description;
  restaurant.logoUrl = logoUrl;
  if (categories) restaurant.categories = categories;
  restaurant.address = address;
  restaurant.openingTime = openingTime;
  restaurant.closingTime = closingTime;

  await restaurant.save();

  res
    .status(200)
    .json(new ApiResponse(200, restaurant, "Restaurant updated successfully"));
});

export const toggleRestaurantOpenStatus = asyncHandler(async (req, res) => {
  if (req.restaurantRole !== "owner") {
    throw new ApiError(403, "Only owners can toggle restaurant status");
  }

  const restaurant = req.restaurant;

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  if (restaurant.isArchived) {
    if (restaurant.isCurrentlyOpen) {
      restaurant.isCurrentlyOpen = false;
      await restaurant.save();
    }
    throw new ApiError(
      403,
      "Restaurant is archived. Please unarchive restaurant to continue"
    );
  }

  await canToggleOpeningStatus(restaurant);

  restaurant.isCurrentlyOpen = !restaurant.isCurrentlyOpen;
  await restaurant.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        getRestaurantProfile(restaurant),
        `Restaurant is now ${restaurant.isCurrentlyOpen ? "open" : "closed"}`
      )
    );
});

export const toggleRestaurantArchiveStatus = asyncHandler(async (req, res) => {
  if (req.restaurantRole !== "owner") {
    throw new ApiError(403, "Only owners can toggle restaurant archive status");
  }

  const restaurant = req.restaurant;

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  // If unarchiving, check subscription limits
  if (restaurant.isArchived) {
    await canUnarchiveRestaurant(req.user!, req.subscription!);
    restaurant.isArchived = false;
    restaurant.archivedAt = undefined;
    restaurant.archivedReason = undefined;
  } else {
    // Archiving is always allowed manually
    restaurant.isArchived = true;
    restaurant.archivedAt = new Date();
    restaurant.archivedReason = req.body?.archivedReason ?? "Archived by owner";
    restaurant.isCurrentlyOpen = false;
  }

  await restaurant.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        getRestaurantProfile(restaurant),
        `Restaurant is now ${restaurant.isArchived ? "archived" : "unarchived"}`
      )
    );
});

export const addRestaurantCategory = asyncHandler(async (req, res) => {
  const validatedData = addCategorySchema.parse(req.body);
  const { category } = validatedData;

  if (req.restaurantRole !== "owner") {
    throw new ApiError(403, "Only owners can create restaurant categories");
  }

  const restaurant = req.restaurant;

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  if (restaurant.isArchived) {
    throw new ApiError(
      403,
      "Restaurant is archived. Please unarchive restaurant to add categories"
    );
  }

  await canAddCategory(restaurant, req.subscription!);

  const categories = restaurant.categories || [];
  // Check if the category already exists
  if (categories.includes(req.body.category.trim())) {
    throw new ApiError(400, "Category already exists in the restaurant");
  }

  // Add categories to the restaurant
  restaurant.categories.push(category);
  await restaurant.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        getRestaurantProfile(restaurant),
        "Category added successfully"
      )
    );
});

export const removeRestaurantCategories = asyncHandler(async (req, res) => {
  if (!req.body?.categories || !Array.isArray(req.body.categories)) {
    throw new ApiError(400, "Categories must be an array");
  }
  const { categories } = req.body;
  if (categories.length === 0) {
    throw new ApiError(400, "At least one category must be provided to remove");
  }
  if (req.restaurantRole !== "owner") {
    throw new ApiError(403, "Only owners can remove restaurant categories");
  }
  const restaurant = req.restaurant;

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  if (restaurant.isArchived) {
    throw new ApiError(
      403,
      "Restaurant is archived. Please unarchive restaurant to remove categories"
    );
  }

  restaurant.categories = restaurant.categories.filter(
    (c) => !categories.includes(c)
  );
  await restaurant.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        getRestaurantProfile(restaurant),
        "Categories removed successfully"
      )
    );
});

export const getRestaurantCategories = asyncHandler(async (req, res) => {
  if (!req.params?.slug) {
    throw new ApiError(400, "Restaurant slug is required");
  }
  const { slug } = req.params;

  const restaurant = await Restaurant.findOne({ slug })
    .select("categories")
    .lean();
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        restaurant.categories,
        "Categories fetched successfully"
      )
    );
});

export const setRestaurantTax = asyncHandler(async (req, res) => {
  if (req.restaurantRole !== "owner") {
    throw new ApiError(403, "Only owners can set restaurant tax");
  }

  if (typeof req.body?.isTaxIncludedInPrice !== "boolean") {
    throw new ApiError(400, "define whether tax is included in price");
  }

  const { isTaxIncludedInPrice, taxLabel, taxRate } = req.body;

  if ((taxRate && typeof taxRate !== "number") || taxRate < 0) {
    throw new ApiError(400, "Tax rate must be a non-negative number");
  }

  if (taxRate && (!taxLabel || typeof taxLabel !== "string")) {
    throw new ApiError(400, "Tax label is required and must be a string");
  }

  if (
    isTaxIncludedInPrice &&
    ((taxLabel && taxLabel.trim() !== "") || (taxRate && taxRate !== 0))
  ) {
    throw new ApiError(
      400,
      "If tax is included in price, tax label and rate should not be provided"
    );
  }

  const restaurant = req.restaurant;

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  if (restaurant.isArchived) {
    throw new ApiError(
      403,
      "Restaurant is archived. Please unarchive restaurant to set tax"
    );
  }

  restaurant.taxRate = isTaxIncludedInPrice ? 0 : taxRate;
  restaurant.taxLabel = taxLabel ? taxLabel : null;
  restaurant.isTaxIncludedInPrice = isTaxIncludedInPrice;
  await restaurant.save();
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found or you are not the owner");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        getRestaurantProfile(restaurant),
        "Tax set successfully"
      )
    );
});

export const checkUniqueRestaurantSlug = asyncHandler(async (req, res) => {
  if (!req.params?.slug) {
    throw new ApiError(400, "Restaurant slug is required");
  }
  const { slug } = req.params;

  const slugSchema = createRestaurantSchema.shape.slug;
  const result = slugSchema.safeParse(slug);
  if (!result.success) {
    throw result.error;
  }

  const restaurant = await Restaurant.exists({ slug });
  if (restaurant) {
    res
      .status(200)
      .json(new ApiResponse(200, false, `${slug} slug is already taken`));
  } else {
    res
      .status(200)
      .json(new ApiResponse(200, true, `${slug} slug is unique and available`));
  }
});

export const updateRestaurantLogo = asyncHandler(async (req, res) => {
  const logoLocalPath = req.file?.path;

  if (req.restaurantRole !== "owner") {
    if (logoLocalPath) fs.unlinkSync(logoLocalPath); // Remove the file if the user is not an owner
    throw new ApiError(403, "Only owners can upload restaurant logos");
  }

  // Check file type
  if (logoLocalPath) {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(req.file!.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(req.file!.mimetype);

    if (!mimetype || !extname) {
      fs.unlinkSync(logoLocalPath); // Remove the file if it's not valid
      throw new ApiError(400, "Only JPEG, JPG, and PNG files are allowed");
    }
  }

  // Check if the restaurant exists and the user is the owner
  const restaurant = req.restaurant;
  if (!restaurant) {
    if (logoLocalPath) fs.unlinkSync(logoLocalPath); // Remove the file if restaurant is not found
    throw new ApiError(404, "Restaurant not found");
  }
  let uploadResponse = null;

  if (restaurant.isArchived) {
    if (logoLocalPath) fs.unlinkSync(logoLocalPath);
    throw new ApiError(
      403,
      "Restaurant is archived. Please unarchive restaurant to update logo"
    );
  }
  // If a logoLocalPath exists, upload the logo to Cloudinary
  if (logoLocalPath) {
    uploadResponse = await cloudinary.upload(
      logoLocalPath,
      `restaurant-logos/restaurants-${req.user!._id}` // Use the owner's ID to create a unique folder
    );
    if (!uploadResponse || !uploadResponse.secure_url) {
      fs.unlinkSync(logoLocalPath); // Remove the file if upload fails
      throw new ApiError(500, "Failed to upload logo to Cloudinary");
    }
  }
  if (restaurant.logoUrl) {
    // Delete the old logo from Cloudinary if it exists
    await cloudinary.delete(restaurant.logoUrl);
  }
  restaurant.logoUrl = uploadResponse?.secure_url ?? undefined; // Update the logoUrl with the new one
  await restaurant.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        getRestaurantProfile(restaurant),
        "Restaurant logo updated successfully"
      )
    );
});

export const getAllStaffOfRestaurant = asyncHandler(async (req, res) => {
  if (req.restaurantRole !== "owner") {
    throw new ApiError(403, "Only owners can view their restaurant staffs");
  }

  const restaurantReq = req.restaurant;
  if (!restaurantReq) {
    throw new ApiError(404, "Restaurant not found");
  }
  const restaurant = await restaurantReq.populate({
    path: "staffMembers.user",
    select: "_id firstName lastName email avatar",
    options: { lean: true },
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        staffs:
          restaurant.staffMembers?.map((sm) => ({
            ...sm.user,
            role: sm.role,
            joinedAt: sm.joinedAt,
          })) || [],
        restaurantName: restaurant.restaurantName,
        slug: restaurant.slug,
        _id: restaurant._id,
      },
      "Staff members retrieved successfully"
    )
  );
});

export const removeStaffFromRestaurant = asyncHandler(async (req, res) => {
  if (!req.body || !req.body.staffId) {
    throw new ApiError(400, "Staff ID is required");
  }

  if (req.restaurantRole !== "owner") {
    throw new ApiError(
      403,
      "Only owners can remove staff from their restaurant"
    );
  }
  const restaurant = req.restaurant;
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }
  if (
    !restaurant.staffMembers?.some(
      (sm) => sm.user.toString() === req.body.staffId
    )
  ) {
    throw new ApiError(400, "Staff member not found in this restaurant");
  }

  restaurant.staffMembers = restaurant.staffMembers.filter(
    (sm) => sm.user.toString() !== req.body.staffId
  );
  await restaurant.save();

  res
    .status(200)
    .json(new ApiResponse(200, null, "Staff removed successfully"));
});

export const getDashboardOperations = asyncHandler(async (req, res) => {
  const timeZone = (req.query.timezone as string) || "Asia/Kolkata";
  const restaurant = req.restaurant;
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  // Role verification handled by verifyRestaurantAccess
  if (!req.restaurantRole) {
    throw new ApiError(403, "Unauthorized role");
  }

  // --- Operations Stats (Live Data) ---
  const nowUtc = new Date();
  const nowInTZ = toZonedTime(nowUtc, timeZone);
  const startOfTodayInTZ = startOfDay(nowInTZ);
  const startOfToday = fromZonedTime(startOfTodayInTZ, timeZone);
  const endOfTodayInTZ = endOfDay(nowInTZ);
  const endOfToday = fromZonedTime(endOfTodayInTZ, timeZone);

  const yesterdayInTZ = new Date(nowInTZ);
  yesterdayInTZ.setDate(yesterdayInTZ.getDate() - 1);
  const startOfYesterdayInTZ = startOfDay(yesterdayInTZ);
  const startOfYesterday = fromZonedTime(startOfYesterdayInTZ, timeZone);
  const endOfYesterdayInTZ = endOfDay(yesterdayInTZ);
  const endOfYesterday = fromZonedTime(endOfYesterdayInTZ, timeZone);

  const [
    newOrders,
    preparingOrders,
    tableStats,
    todayTotalOrders,
    yesterdayTotalOrdersAgg,
    unpaidOrders,
    readyOrders,
  ] = await Promise.all([
    Order.countDocuments({
      restaurantId: restaurant._id,
      status: "pending",
    }),
    Order.aggregate([
      {
        $match: {
          restaurantId: restaurant._id,
          status: "preparing",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]),
    Table.aggregate([
      {
        $match: {
          restaurantId: restaurant._id,
          isArchived: false, // Ensure we don't count archived tables
        },
      },
      {
        $group: {
          _id: null,
          occupiedTableCount: {
            $sum: { $cond: [{ $eq: ["$isOccupied", true] }, 1, 0] },
          },
          freeTableCount: {
            $sum: { $cond: [{ $eq: ["$isOccupied", false] }, 1, 0] },
          },
        },
      },
    ]),
    Order.aggregate([
      {
        $match: {
          restaurantId: restaurant._id,
          createdAt: { $gte: startOfToday, $lte: endOfToday },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      {
        $match: {
          restaurantId: restaurant._id,
          createdAt: { $gte: startOfYesterday, $lte: endOfYesterday },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      {
        $match: {
          restaurantId: restaurant._id,
          status: { $ne: "cancelled" },
          isPaid: false,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      {
        $match: {
          restaurantId: restaurant._id,
          status: "ready",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]),
  ]);

  const todayTotal = todayTotalOrders[0]?.total || 0;
  const yesterdayTotal = yesterdayTotalOrdersAgg[0]?.total || 0;

  let totalOrderChangePercent = 0;
  if (yesterdayTotal !== 0) {
    totalOrderChangePercent =
      ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100;
  } else if (todayTotal > 0) {
    totalOrderChangePercent = 100;
  }

  const operations = {
    newOrders,
    preparingOrders: preparingOrders[0]?.total || 0,
    occupiedTables: tableStats[0]?.occupiedTableCount || 0,
    freeTables: tableStats[0]?.freeTableCount || 0,
    todayTotalOrders: todayTotal,
    yesterdayTotalOrders: yesterdayTotal,
    totalOrderChangePercent,
    unpaidOrders: unpaidOrders[0]?.total || 0,
    readyOrders: readyOrders[0]?.total || 0,
  };

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        operations,
        "Dashboard operations retrieved successfully"
      )
    );
});

export const getAnalyticsKPIs = asyncHandler(async (req, res) => {
  const timeZone = (req.query.timezone as string) || "Asia/Kolkata";

  const restaurant = req.restaurant;
  if (!restaurant) throw new ApiError(404, "Restaurant not found");

  // Role verification handled by verifyRestaurantAccess
  if (req.restaurantRole !== "owner") {
    throw new ApiError(403, "You can't access this data");
  }

  const nowUtc = new Date();
  const nowInTZ = toZonedTime(nowUtc, timeZone);
  const endOfTodayInTZ = endOfDay(nowInTZ);
  const endOfToday = fromZonedTime(endOfTodayInTZ, timeZone);

  // Time bounds for current and prev 30-day rolling windows
  const startOfCurrentMonth = startOfMonth(endOfToday);
  const startOfPreviousMonth = subMonths(startOfCurrentMonth, 1);

  const [
    allTimeSalesAgg,
    allTimeOrdersCount,
    currentMonthSalesAgg,
    previousMonthSalesAgg,
    currentMonthOrdersCount,
    previousMonthOrdersCount,
    activeMenuItemsCount,
  ] = await Promise.all([
    // 1. All Time Sales
    Order.aggregate([
      {
        $match: {
          restaurantId: restaurant._id,
          isPaid: true,
          status: "completed",
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    // 2. All Time Orders
    Order.countDocuments({
      restaurantId: restaurant._id,
      isPaid: true,
      status: "completed",
    }),
    // 3. Current Month Sales
    Order.aggregate([
      {
        $match: {
          restaurantId: restaurant._id,
          isPaid: true,
          status: "completed",
          createdAt: { $gte: startOfCurrentMonth, $lte: endOfToday },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    // 4. Previous Month Sales
    Order.aggregate([
      {
        $match: {
          restaurantId: restaurant._id,
          isPaid: true,
          status: "completed",
          createdAt: { $gte: startOfPreviousMonth, $lt: startOfCurrentMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    // 5. Current Month Orders
    Order.countDocuments({
      restaurantId: restaurant._id,
      isPaid: true,
      status: "completed",
      createdAt: { $gte: startOfCurrentMonth, $lte: endOfToday },
    }),
    // 6. Previous Month Orders
    Order.countDocuments({
      restaurantId: restaurant._id,
      isPaid: true,
      status: "completed",
      createdAt: { $gte: startOfPreviousMonth, $lt: startOfCurrentMonth },
    }),
    // 7. Active Menu Items Count
    FoodItem.countDocuments({
      restaurantId: restaurant._id,
      isAvailable: true,
      isArchived: false,
    }),
  ]);

  // Extract raw values
  const totalRevenue = allTimeSalesAgg[0]?.total || 0;
  const currentMonthRevenue = currentMonthSalesAgg[0]?.total || 0;
  const previousMonthRevenue = previousMonthSalesAgg[0]?.total || 0;

  // Percentage Calculations (Avoid divide by zero)
  const calculatePercentageString = (current: number, previous: number) => {
    if (previous === 0) {
      if (current === 0) return "0% from last month";
      return "+100% from last month"; // If previous was 0 but we have sales, practically an infinite increase, 100% is safe UI
    }
    const delta = ((current - previous) / previous) * 100;
    const sign = delta > 0 ? "+" : "";
    return `${sign}${delta.toFixed(1)}% from last month`;
  };

  const salesDeltaString = calculatePercentageString(
    currentMonthRevenue,
    previousMonthRevenue
  );
  const ordersDeltaString = calculatePercentageString(
    currentMonthOrdersCount,
    previousMonthOrdersCount
  );

  const averageOrderValue =
    allTimeOrdersCount > 0 ? totalRevenue / allTimeOrdersCount : 0;

  const kpis = {
    allTimeSales: {
      value: totalRevenue,
      description: salesDeltaString,
    },
    allTimeOrders: {
      value: allTimeOrdersCount,
      description: ordersDeltaString,
    },
    averageOrderValue: {
      value: averageOrderValue,
      description: "Average spend per order",
    },
    activeMenuItems: {
      value: activeMenuItemsCount,
      description: "Current active offerings",
    },
  };

  res
    .status(200)
    .json(new ApiResponse(200, kpis, "KPIs retrieved successfully"));
});

export const getAnalyticsRevenue = asyncHandler(async (req, res) => {
  const timeZone = (req.query.timezone as string) || "Asia/Kolkata";
  const { startDate, endDate, groupBy = "day" } = req.query;

  if (!req.restaurant || req.restaurantRole !== "owner")
    throw new ApiError(403, "You can't access this data");

  let queryStart: Date;
  let queryEnd: Date;
  const nowUtc = new Date();
  const nowInTZ = toZonedTime(nowUtc, timeZone);

  if (startDate && endDate) {
    queryStart = fromZonedTime(
      startOfDay(toZonedTime(new Date(startDate as string), timeZone)),
      timeZone
    );
    queryEnd = fromZonedTime(
      endOfDay(toZonedTime(new Date(endDate as string), timeZone)),
      timeZone
    );
  } else {
    const thirtyDaysAgo = new Date(nowInTZ);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    queryStart = fromZonedTime(startOfDay(thirtyDaysAgo), timeZone);
    queryEnd = fromZonedTime(endOfDay(nowInTZ), timeZone);
  }

  let formatString = "%Y-%m-%d";
  if (groupBy === "week") {
    // We will leave this in case it's used elsewhere, but week-sliding is preferred now
    formatString = "%m-%d";
  } else if (groupBy === "month") {
    formatString = "%Y-%m";
  } else if (groupBy === "hour") {
    formatString = "%Y-%m-%d %H:00";
  }

  const rawSalesTrend = await Order.aggregate([
    {
      $match: {
        restaurantId: req.restaurant._id,
        status: "completed",
        isPaid: true,
        createdAt: { $gte: queryStart, $lte: queryEnd },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: formatString,
            date: "$createdAt",
            timezone: timeZone,
          },
        },
        total: { $sum: "$totalAmount" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const salesTrendMap = new Map(rawSalesTrend.map((item) => [item._id, item]));
  const salesTrend = [];

  if (groupBy === "hour") {
    // Generate 24 hours for the queryStart date
    const loopDateInTZ = new Date(toZonedTime(queryStart, timeZone));
    loopDateInTZ.setHours(0, 0, 0, 0);

    for (let i = 0; i < 24; i++) {
      const year = loopDateInTZ.getFullYear();
      const month = String(loopDateInTZ.getMonth() + 1).padStart(2, "0");
      const day = String(loopDateInTZ.getDate()).padStart(2, "0");
      const hour = String(loopDateInTZ.getHours()).padStart(2, "0");

      const dateString = `${year}-${month}-${day} ${hour}:00`;
      salesTrend.push(
        salesTrendMap.get(dateString) || {
          _id: dateString,
          total: 0,
          orders: 0,
        }
      );
      loopDateInTZ.setHours(loopDateInTZ.getHours() + 1);
    }
  } else if (groupBy === "week-sliding") {
    // 1. Generate ALL days
    const dailyData = [];
    const loopDateInTZ = new Date(toZonedTime(queryStart, timeZone));
    const loopEndDateInTZ = new Date(toZonedTime(queryEnd, timeZone));

    while (loopDateInTZ <= loopEndDateInTZ) {
      const year = loopDateInTZ.getFullYear();
      const month = String(loopDateInTZ.getMonth() + 1).padStart(2, "0");
      const day = String(loopDateInTZ.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      const existingData = salesTrendMap.get(dateString);
      dailyData.push({
        _id: dateString,
        total: existingData ? existingData.total : 0,
        orders: existingData ? existingData.orders : 0,
        originalDate: new Date(loopDateInTZ), // keep track for exact sliding window mapping
      });
      loopDateInTZ.setDate(loopDateInTZ.getDate() + 1);
    }

    // 2. Bucket them into exact 7-day chunks starting from Day 0
    for (let i = 0; i < dailyData.length; i += 7) {
      const chunk = dailyData.slice(i, i + 7);

      const chunkStartDate = chunk[0].originalDate;
      const chunkEndDate = chunk[chunk.length - 1].originalDate;

      // Format as "2026-02-07 - 2026-02-13" etc. to preserve exact bounds
      const startStr = `${chunkStartDate.getFullYear()}-${String(chunkStartDate.getMonth() + 1).padStart(2, "0")}-${String(chunkStartDate.getDate()).padStart(2, "0")}`;
      const endStr = `${chunkEndDate.getFullYear()}-${String(chunkEndDate.getMonth() + 1).padStart(2, "0")}-${String(chunkEndDate.getDate()).padStart(2, "0")}`;

      const chunkId = `${startStr} - ${endStr}`;

      const chunkTotal = chunk.reduce((sum, item) => sum + item.total, 0);
      const chunkOrders = chunk.reduce((sum, item) => sum + item.orders, 0);

      salesTrend.push({
        _id: chunkId,
        total: chunkTotal,
        orders: chunkOrders,
        startDateStr: `${chunkStartDate.getFullYear()}-${String(chunkStartDate.getMonth() + 1).padStart(2, "0")}-${String(chunkStartDate.getDate()).padStart(2, "0")}`, // used for sorting later if needed
      });
    }
  } else if (groupBy === "month-sliding") {
    // 1. Generate ALL days
    const dailyData = [];
    const loopDateInTZ = new Date(toZonedTime(queryStart, timeZone));
    const loopEndDateInTZ = new Date(toZonedTime(queryEnd, timeZone));

    while (loopDateInTZ <= loopEndDateInTZ) {
      const year = loopDateInTZ.getFullYear();
      const month = String(loopDateInTZ.getMonth() + 1).padStart(2, "0");
      const day = String(loopDateInTZ.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      const existingData = salesTrendMap.get(dateString);
      dailyData.push({
        _id: dateString,
        total: existingData ? existingData.total : 0,
        orders: existingData ? existingData.orders : 0,
        originalDate: new Date(loopDateInTZ), // keep track for exact sliding window mapping
      });
      loopDateInTZ.setDate(loopDateInTZ.getDate() + 1);
    }

    // 2. Bucket them into exact 30-day chunks starting from Day 0
    for (let i = 0; i < dailyData.length; i += 30) {
      const chunk = dailyData.slice(i, i + 30);

      const chunkStartDate = chunk[0].originalDate;
      const chunkEndDate = chunk[chunk.length - 1].originalDate;

      // Format as "2026-02-07 - 2026-02-13" etc. to preserve exact bounds
      const startStr = `${chunkStartDate.getFullYear()}-${String(chunkStartDate.getMonth() + 1).padStart(2, "0")}-${String(chunkStartDate.getDate()).padStart(2, "0")}`;
      const endStr = `${chunkEndDate.getFullYear()}-${String(chunkEndDate.getMonth() + 1).padStart(2, "0")}-${String(chunkEndDate.getDate()).padStart(2, "0")}`;

      const chunkId = `${startStr} - ${endStr}`;

      const chunkTotal = chunk.reduce((sum, item) => sum + item.total, 0);
      const chunkOrders = chunk.reduce((sum, item) => sum + item.orders, 0);

      salesTrend.push({
        _id: chunkId,
        total: chunkTotal,
        orders: chunkOrders,
        startDateStr: `${chunkStartDate.getFullYear()}-${String(chunkStartDate.getMonth() + 1).padStart(2, "0")}-${String(chunkStartDate.getDate()).padStart(2, "0")}`, // used for sorting later if needed
      });
    }
  } else {
    // Standard Day or Month loop
    const loopDateInTZ = new Date(toZonedTime(queryStart, timeZone));
    const loopEndDateInTZ = new Date(toZonedTime(queryEnd, timeZone));

    while (loopDateInTZ <= loopEndDateInTZ) {
      let dateString = "";
      if (groupBy === "month") {
        const year = loopDateInTZ.getFullYear();
        const month = String(loopDateInTZ.getMonth() + 1).padStart(2, "0");
        dateString = `${year}-${month}`;
      } else {
        const year = loopDateInTZ.getFullYear();
        const month = String(loopDateInTZ.getMonth() + 1).padStart(2, "0");
        const day = String(loopDateInTZ.getDate()).padStart(2, "0");
        dateString = `${year}-${month}-${day}`;
      }

      salesTrend.push(
        salesTrendMap.get(dateString) || {
          _id: dateString,
          total: 0,
          orders: 0,
        }
      );
      if (groupBy === "month") {
        loopDateInTZ.setMonth(loopDateInTZ.getMonth() + 1);
      } else {
        loopDateInTZ.setDate(loopDateInTZ.getDate() + 1);
      }
    }
  }

  const finalSalesTrend = groupBy === "week" ? rawSalesTrend : salesTrend;

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        finalSalesTrend,
        "Revenue trend retrieved successfully"
      )
    );
});

export const getAnalyticsTrending = asyncHandler(async (req, res) => {
  const timeZone = (req.query.timezone as string) || "Asia/Kolkata";
  const { startDate, endDate } = req.query;

  if (!req.restaurant || req.restaurantRole !== "owner")
    throw new ApiError(403, "You can't access this data");

  let queryStart: Date;
  let queryEnd: Date;
  const nowUtc = new Date();
  const nowInTZ = toZonedTime(nowUtc, timeZone);

  if (startDate && endDate) {
    queryStart = fromZonedTime(
      startOfDay(toZonedTime(new Date(startDate as string), timeZone)),
      timeZone
    );
    queryEnd = fromZonedTime(
      endOfDay(toZonedTime(new Date(endDate as string), timeZone)),
      timeZone
    );
  } else {
    // Default last 7 days for trending to keep it fresh
    const sevenDaysAgo = new Date(nowInTZ);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    queryStart = fromZonedTime(startOfDay(sevenDaysAgo), timeZone);
    queryEnd = fromZonedTime(endOfDay(nowInTZ), timeZone);
  }

  const topFoodItems = await Order.aggregate([
    {
      $match: {
        restaurantId: req.restaurant._id,
        status: "completed",
        isPaid: true,
        createdAt: { $gte: queryStart, $lte: queryEnd },
      },
    },
    { $unwind: "$foodItems" },
    {
      $group: {
        _id: {
          foodItemId: "$foodItems.foodItemId",
          variantName: "$foodItems.variantName",
        },
        count: { $sum: "$foodItems.quantity" },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "fooditems",
        localField: "_id.foodItemId",
        foreignField: "_id",
        as: "foodItem",
      },
    },
    { $unwind: "$foodItem" },
    {
      $project: {
        _id: "$_id.foodItemId",
        foodName: "$foodItem.foodName",
        firstImageUrl: { $arrayElemAt: ["$foodItem.imageUrls", 0] },
        variantName: "$_id.variantName",
        count: 1,
      },
    },
  ]);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        topFoodItems,
        "Trending foods retrieved successfully"
      )
    );
});

export const getAnalyticsCategories = asyncHandler(async (req, res) => {
  const timeZone = (req.query.timezone as string) || "Asia/Kolkata";
  const { startDate, endDate } = req.query;

  if (!req.restaurant || req.restaurantRole !== "owner") {
    throw new ApiError(403, "You can't access this data");
  }

  let queryStart: Date;
  let queryEnd: Date;
  const nowUtc = new Date();
  const nowInTZ = toZonedTime(nowUtc, timeZone);

  if (startDate && endDate) {
    queryStart = fromZonedTime(
      startOfDay(toZonedTime(new Date(startDate as string), timeZone)),
      timeZone
    );
    queryEnd = fromZonedTime(
      endOfDay(toZonedTime(new Date(endDate as string), timeZone)),
      timeZone
    );
  } else {
    const thirtyDaysAgo = new Date(nowInTZ);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    queryStart = fromZonedTime(startOfDay(thirtyDaysAgo), timeZone);
    queryEnd = fromZonedTime(endOfDay(nowInTZ), timeZone);
  }

  const categoryBreakdown = await Order.aggregate([
    {
      $match: {
        restaurantId: req.restaurant._id,
        status: "completed",
        isPaid: true,
        createdAt: { $gte: queryStart, $lte: queryEnd },
      },
    },
    { $unwind: "$foodItems" },
    {
      $lookup: {
        from: "fooditems",
        localField: "foodItems.foodItemId",
        foreignField: "_id",
        as: "foodDetails",
      },
    },
    { $unwind: "$foodDetails" },
    {
      $group: {
        _id: { $ifNull: ["$foodDetails.category", "Uncategorized"] },
        totalRevenue: {
          $sum: { $multiply: ["$foodItems.finalPrice", "$foodItems.quantity"] },
        },
        count: { $sum: "$foodItems.quantity" },
      },
    },
    { $sort: { totalRevenue: -1 } },
  ]);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        categoryBreakdown,
        "Category breakdown retrieved successfully"
      )
    );
});

export const getAnalyticsTopTables = asyncHandler(async (req, res) => {
  const timeZone = (req.query.timezone as string) || "Asia/Kolkata";
  const { startDate, endDate } = req.query;

  if (!req.restaurant || req.restaurantRole !== "owner") {
    throw new ApiError(403, "You can't access this data");
  }

  let queryStart: Date;
  let queryEnd: Date;
  const nowUtc = new Date();
  const nowInTZ = toZonedTime(nowUtc, timeZone);

  if (startDate && endDate) {
    queryStart = fromZonedTime(
      startOfDay(toZonedTime(new Date(startDate as string), timeZone)),
      timeZone
    );
    queryEnd = fromZonedTime(
      endOfDay(toZonedTime(new Date(endDate as string), timeZone)),
      timeZone
    );
  } else {
    // Default 7 days
    const sevenDaysAgo = new Date(nowInTZ);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    queryStart = fromZonedTime(startOfDay(sevenDaysAgo), timeZone);
    queryEnd = fromZonedTime(endOfDay(nowInTZ), timeZone);
  }

  const topTables = await Order.aggregate([
    {
      $match: {
        restaurantId: req.restaurant._id,
        status: "completed",
        isPaid: true,
        tableId: { $exists: true, $ne: null },
        createdAt: { $gte: queryStart, $lte: queryEnd },
      },
    },
    {
      $group: {
        _id: "$tableId",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "tables",
        localField: "_id",
        foreignField: "_id",
        as: "tableDetails",
      },
    },
    { $unwind: "$tableDetails" },
    {
      $project: {
        _id: 1,
        tableName: "$tableDetails.tableName",
        count: 1,
      },
    },
  ]);

  res
    .status(200)
    .json(new ApiResponse(200, topTables, "Top tables retrieved successfully"));
});
