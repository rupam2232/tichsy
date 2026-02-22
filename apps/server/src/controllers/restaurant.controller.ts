import path from "path";
import fs from "fs";
import cloudinary from "../utils/cloudinary.js";
import { Restaurant } from "../models/restaurant.models.js";
import { Types } from "mongoose";
import {
  canAddCategory,
  canCreateRestaurant,
  canToggleOpeningStatus,
  canUnarchiveRestaurant,
} from "../service/restaurant.service.js";
import { checkStaffLimit } from "../service/subscription.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { restaurantCreatedTemplate } from "../templates/emailTemplates.js";
import sendEmail from "../utils/sendEmail.js";
import { Order } from "../models/order.model.js";
import { Table } from "../models/table.model.js";
import { startOfDay, endOfDay } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { User } from "../models/user.model.js";
import {
  createRestaurantSchema,
  updateRestaurantSchema,
  addCategorySchema,
} from "@repo/types";

export const createRestaurant = asyncHandler(async (req, res) => {
  const validatedData = createRestaurantSchema.parse(req.body);
  const { restaurantName, slug, description, address, logoUrl } = validatedData;
  const ownerId = req.user!._id;

  if (req.user!.role !== "owner") {
    throw new ApiError(403, "Only owners can create restaurants.");
  }

  await canCreateRestaurant(req.user!, req.subscription!);

  // Check if the restaurant already exists
  const existingRestaurant = await Restaurant.findOne({
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

export const getAllRestaurantofOwner = asyncHandler(async (req, res) => {
  if (req.user!.role !== "owner") {
    throw new ApiError(403, "Only owners can view their restaurants");
  }

  const restaurants = await Restaurant.find({ ownerId: req.user!._id }).select(
    "_id restaurantName slug description address logoUrl isCurrentlyOpen isArchived"
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, restaurants, "Restaurants fetched successfully")
    );
});

export const getRestaurantofStaff = asyncHandler(async (req, res) => {
  if (req.user!.role !== "staff") {
    throw new ApiError(403, "Only staff can view their restaurant");
  }
  const restaurant = await Restaurant.findOne({
    staffIds: { $in: [req.user!._id] },
  }).select(
    "_id restaurantName slug description address logoUrl isCurrentlyOpen isArchived"
  );
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found for this staff member");
  }
  res
    .status(200)
    .json(new ApiResponse(200, restaurant, "Restaurant fetched successfully"));
});

export const getRestaurantBySlug = asyncHandler(async (req, res) => {
  if (!req.params?.slug) {
    throw new ApiError(400, "Restaurant slug is required.");
  }
  const { slug } = req.params;
  if (!slug) {
    throw new ApiError(400, "Restaurant slug is required.");
  }

  const { forMetaData = "false" } = req.query;
  const isForMetaData = forMetaData === "true";
  let selectFields = "-staffIds -ownerId -__v -updatedAt";
  if (isForMetaData) {
    selectFields =
      "-staffIds -ownerId -__v -updatedAt -createdAt -archivedAt -archivedReason -taxRate -taxLabel -isTaxIncludedInPrice";
  }

  const restaurant = await Restaurant.findOne({ slug }).select(selectFields);
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found.");
  }
  res
    .status(200)
    .json(new ApiResponse(200, restaurant, "Restaurant fetched successfully"));
});

export const updateRestaurantDetails = asyncHandler(async (req, res) => {
  if (!req.params || !req.params.slug) {
    throw new ApiError(400, "Restaurant slug is required");
  }
  const { slug } = req.params;

  if (req.user!.role !== "owner") {
    throw new ApiError(403, "Only owners can update restaurant details");
  }

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

  if (slug !== newSlug) {
    const duplicateRestaurantSlug = await Restaurant.findOne({
      slug: newSlug,
    });
    if (duplicateRestaurantSlug) {
      throw new ApiError(400, "Slug is already taken");
    }
  }

  const restaurant = await Restaurant.findOne({
    slug,
    ownerId: req.user!._id,
  }).select("-staffIds -__v -updatedAt");

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
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
    const duplicateRestaurantName = await Restaurant.findOne({
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
  if (!req.params?.slug) {
    throw new ApiError(400, "Restaurant slug is required.");
  }
  const { slug } = req.params;
  if (req.user!.role !== "owner") {
    throw new ApiError(403, "Only owners can toggle restaurant status.");
  }

  const restaurant = await Restaurant.findOne({
    slug,
    ownerId: req.user!._id,
  }).select(
    "_id restaurantName slug description address logoUrl isCurrentlyOpen ownerId isArchived"
  );

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found or you are not the owner.");
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
        restaurant,
        `Restaurant is now ${restaurant.isCurrentlyOpen ? "open" : "closed"}`
      )
    );
});

export const toggleRestaurantArchiveStatus = asyncHandler(async (req, res) => {
  if (!req.params?.slug) {
    throw new ApiError(400, "Restaurant slug is required.");
  }
  const { slug } = req.params;
  if (req.user!.role !== "owner") {
    throw new ApiError(
      403,
      "Only owners can toggle restaurant archive status."
    );
  }

  const restaurant = await Restaurant.findOne({
    slug,
    ownerId: req.user!._id,
  }).select(
    "_id restaurantName slug description address logoUrl isCurrentlyOpen isArchived ownerId"
  );

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found or you are not the owner.");
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
        restaurant,
        `Restaurant is now ${restaurant.isArchived ? "archived" : "unarchived"}`
      )
    );
});

export const addRestaurantCategory = asyncHandler(async (req, res) => {
  if (!req.params?.slug) {
    throw new ApiError(400, "Restaurant slug is required");
  }
  const { slug } = req.params;

  const validatedData = addCategorySchema.parse(req.body);
  const { category } = validatedData;

  if (req.user!.role !== "owner") {
    throw new ApiError(403, "Only owners can create restaurant categories");
  }

  const restaurant = await Restaurant.findOne({
    slug,
    ownerId: req.user!._id,
  }).select(
    "_id restaurantName slug description address logoUrl isCurrentlyOpen categories isArchived"
  );

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  if (restaurant.isArchived) {
    throw new ApiError(
      403,
      "Restaurant is archived. Please unarchive restaurant to add categories."
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
    .json(new ApiResponse(200, restaurant, "Category added successfully"));
});

export const removeRestaurantCategories = asyncHandler(async (req, res) => {
  if (!req.params?.slug) {
    throw new ApiError(400, "Restaurant slug is required.");
  }
  const { slug } = req.params;
  if (!req.body?.categories || !Array.isArray(req.body.categories)) {
    throw new ApiError(400, "Categories must be an array.");
  }
  const { categories } = req.body;
  if (categories.length === 0) {
    throw new ApiError(
      400,
      "At least one category must be provided to remove."
    );
  }
  if (req.user!.role !== "owner") {
    throw new ApiError(403, "Only owners can remove restaurant categories.");
  }
  const restaurant = await Restaurant.findOne({
    slug,
    ownerId: req.user!._id,
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found or you are not the owner.");
  }

  if (restaurant.isArchived) {
    throw new ApiError(
      403,
      "Restaurant is archived. Please unarchive restaurant to remove categories."
    );
  }

  await Restaurant.updateOne(
    { _id: restaurant._id },
    { $pull: { categories: { $in: categories } } },
    { runValidators: true }
  );

  // Refresh restaurant data to return
  const updatedRestaurant = await Restaurant.findById(restaurant._id).select(
    "_id restaurantName slug description address logoUrl isCurrentlyOpen categories"
  );

  if (!updatedRestaurant) {
    throw new ApiError(404, "Restaurant not found or you are not the owner.");
  }
  res
    .status(200)
    .json(
      new ApiResponse(200, updatedRestaurant, "Categories removed successfully")
    );
});

export const getRestaurantCategories = asyncHandler(async (req, res) => {
  if (!req.params?.slug) {
    throw new ApiError(400, "Restaurant slug is required.");
  }
  const { slug } = req.params;

  const restaurant = await Restaurant.findOne({ slug });
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found.");
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
  if (!req.params?.slug) {
    throw new ApiError(400, "Restaurant slug is required");
  }
  const { slug } = req.params;

  if (req.user!.role !== "owner") {
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

  const restaurant = await Restaurant.findOne({
    slug,
    ownerId: req.user!._id,
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found or you are not the owner");
  }

  if (restaurant.isArchived) {
    throw new ApiError(
      403,
      "Restaurant is archived. Please unarchive restaurant to set tax."
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
    .json(new ApiResponse(200, restaurant, "Tax set successfully"));
});

export const checkUniqueRestaurantSlug = asyncHandler(async (req, res) => {
  if (!req.params?.slug) {
    throw new ApiError(400, "Restaurant slug is required");
  }
  const { slug } = req.params;

  if (slug.length < 3 || slug.length > 20) {
    throw new ApiError(400, "Slug must be between 3 to 20 characters long");
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new ApiError(
      400,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    );
  }

  const restaurant = await Restaurant.findOne({ slug });
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

  if (!req.params?.slug) {
    if (logoLocalPath) fs.unlinkSync(logoLocalPath); // Remove the file if slug is not provided
    throw new ApiError(400, "Restaurant slug is required");
  }

  const { slug } = req.params;

  if (req.user!.role !== "owner") {
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
  const restaurant = await Restaurant.findOne({
    slug,
    ownerId: req.user!._id,
  }).select(
    "_id restaurantName slug description address logoUrl isCurrentlyOpen categories isArchived"
  );
  if (!restaurant) {
    if (logoLocalPath) fs.unlinkSync(logoLocalPath); // Remove the file if restaurant is not found
    throw new ApiError(404, "Restaurant not found or you are not the owner");
  }
  let uploadResponse = null;

  if (restaurant.isArchived) {
    if (logoLocalPath) fs.unlinkSync(logoLocalPath);
    throw new ApiError(
      403,
      "Restaurant is archived. Please unarchive restaurant to update logo."
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
      new ApiResponse(200, restaurant, "Restaurant logo updated successfully")
    );
});

export const getAllStaffOfRestaurant = asyncHandler(async (req, res) => {
  if (!req.params || !req.params.slug) {
    throw new ApiError(400, "Restaurant slug is required");
  }

  if (req.user!.role !== "owner") {
    throw new ApiError(403, "Only owners can view their restaurant staffs");
  }

  const restaurant = await Restaurant.findOne({
    slug: req.params.slug,
    ownerId: req.user!._id,
  })
    .populate({
      path: "staffIds",
      select: "_id firstName lastName email role avatar",
    })
    .select("staffIds restaurantName slug _id");

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        staffs: restaurant.staffIds,
        restaurantName: restaurant.restaurantName,
        slug: restaurant.slug,
        _id: restaurant._id,
      },
      "Staff members retrieved successfully"
    )
  );
});

export const addStaffToRestaurant = asyncHandler(async (req, res) => {
  if (!req.params || !req.params.slug) {
    throw new ApiError(400, "Restaurant slug is required");
  }

  if (!req.body || !req.body.staffId) {
    throw new ApiError(400, "Staff ID is required");
  }

  if (req.user!.role !== "owner") {
    throw new ApiError(403, "Only owners can add staff to their restaurant");
  }

  const restaurant = await Restaurant.findOne({
    slug: req.params.slug,
    ownerId: req.user!._id,
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  if (req.user!.id === req.body.staffId) {
    throw new ApiError(400, "You cannot add yourself as a staff member");
  }

  if (restaurant.isArchived) {
    throw new ApiError(400, "Restaurant is archived");
  }

  if (restaurant.staffIds?.includes(req.body.staffId)) {
    throw new ApiError(400, "Staff member is already added to this restaurant");
  }

  const staff = await User.findById(req.body.staffId);
  if (!staff) {
    throw new ApiError(404, "Staff not found");
  }

  // Check subscription limits for staff
  await checkStaffLimit(restaurant, restaurant.ownerId);

  restaurant.staffIds?.push(req.body.staffId);
  await restaurant.save();

  res
    .status(200)
    .json(new ApiResponse(200, restaurant, "Staff added successfully"));
});

export const removeStaffFromRestaurant = asyncHandler(async (req, res) => {
  if (!req.params || !req.params.slug) {
    throw new ApiError(400, "Restaurant slug is required");
  }

  if (!req.body || !req.body.staffId) {
    throw new ApiError(400, "Staff ID is required");
  }

  if (req.user!.role !== "owner") {
    throw new ApiError(
      403,
      "Only owners can remove staff from their restaurant"
    );
  }
  const restaurant = await Restaurant.findOne({
    slug: req.params.slug,
    ownerId: req.user!._id,
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }
  if (!restaurant.staffIds?.includes(req.body.staffId)) {
    throw new ApiError(400, "Staff member not found in this restaurant");
  }

  restaurant.staffIds = restaurant.staffIds.filter(
    (id) => id !== req.body.staffId
  );
  await restaurant.save();

  res
    .status(200)
    .json(new ApiResponse(200, restaurant, "Staff removed successfully"));
});

// Operations endpoint - Fast, live data for Staff & Owners
export const getDashboardOperations = asyncHandler(async (req, res) => {
  if (!req.params || !req.params.slug) {
    throw new ApiError(400, "Restaurant slug is required");
  }
  const { slug } = req.params;
  const timeZone = (req.query.timezone as string) || "Asia/Kolkata";

  const restaurant = await Restaurant.findOne({ slug });
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  // Role verification - Both staff and owner can access
  if (req.user!.role === "owner") {
    if (restaurant.ownerId.toString() !== req.user!.id) {
      throw new ApiError(403, "You can't access this data");
    }
  } else if (req.user!.role === "staff") {
    if (
      !restaurant.staffIds ||
      !restaurant.staffIds.map((id) => id.toString()).includes(req.user!.id)
    ) {
      throw new ApiError(403, "You can't access this data");
    }
  } else {
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

// Analytics endpoint - Slower, historical data for Owners only
export const getDashboardAnalytics = asyncHandler(async (req, res) => {
  if (!req.params || !req.params.slug) {
    throw new ApiError(400, "Restaurant slug is required");
  }
  const { slug } = req.params;
  const timeZone = (req.query.timezone as string) || "Asia/Kolkata";
  const { startDate, endDate } = req.query;

  const restaurant = await Restaurant.findOne({ slug });
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  // Role verification - OWNER ONLY
  if (
    req.user!.role !== "owner" ||
    restaurant.ownerId.toString() !== req.user!.id
  ) {
    throw new ApiError(403, "You can't access this data");
  }

  const nowUtc = new Date();
  const nowInTZ = toZonedTime(nowUtc, timeZone);
  const startOfTodayInTZ = startOfDay(nowInTZ);
  const startOfToday = fromZonedTime(startOfTodayInTZ, timeZone);
  const endOfTodayInTZ = endOfDay(nowInTZ);
  const endOfToday = fromZonedTime(endOfTodayInTZ, timeZone);

  // Determine date range for analytics
  let queryStart: Date;
  let queryEnd: Date;

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
    // Default to last 30 days
    const thirtyDaysAgo = new Date(nowInTZ);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    queryStart = fromZonedTime(startOfDay(thirtyDaysAgo), timeZone);
    queryEnd = endOfToday;
  }

  // 1. Sales & Orders in selected period
  const [periodSalesAgg, periodOrdersAgg] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          restaurantId: restaurant._id,
          isPaid: true,
          status: "completed",
          createdAt: { $gte: queryStart, $lte: queryEnd },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Order.countDocuments({
      restaurantId: restaurant._id,
      status: "completed",
      createdAt: { $gte: queryStart, $lte: queryEnd },
    }),
  ]);

  // 2. All Time Sales
  const allTimeSalesAgg = await Order.aggregate([
    {
      $match: {
        restaurantId: restaurant._id,
        isPaid: true,
        status: "completed",
      },
    },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);

  // 3. Sales Trend
  const rawSalesTrend = await Order.aggregate([
    {
      $match: {
        restaurantId: restaurant._id,
        status: "completed",
        createdAt: { $gte: queryStart, $lte: queryEnd },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
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
  let loopDateInTZ = new Date(toZonedTime(queryStart, timeZone));
  const loopEndDateInTZ = new Date(toZonedTime(queryEnd, timeZone));

  while (loopDateInTZ <= loopEndDateInTZ) {
    const year = loopDateInTZ.getFullYear();
    const month = String(loopDateInTZ.getMonth() + 1).padStart(2, "0");
    const day = String(loopDateInTZ.getDate()).padStart(2, "0");
    const dateString = `${year}-${month}-${day}`;

    if (salesTrendMap.has(dateString)) {
      salesTrend.push(salesTrendMap.get(dateString));
    } else {
      salesTrend.push({ _id: dateString, total: 0, orders: 0 });
    }
    loopDateInTZ.setDate(loopDateInTZ.getDate() + 1);
  }

  // 4. Top Food Items
  const topFoodItems = await Order.aggregate([
    {
      $match: {
        restaurantId: restaurant._id,
        createdAt: { $gte: queryStart, $lte: queryEnd },
      },
    },
    { $unwind: "$foodItems" },
    {
      $group: {
        _id: "$foodItems.foodItemId",
        variantName: { $first: "$foodItems.variantName" },
        count: { $sum: "$foodItems.quantity" },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "fooditems",
        localField: "_id",
        foreignField: "_id",
        as: "foodItem",
      },
    },
    { $unwind: "$foodItem" },
    {
      $project: {
        _id: 1,
        foodName: "$foodItem.foodName",
        firstImageUrl: { $arrayElemAt: ["$foodItem.imageUrls", 0] },
        variantName: 1,
        count: 1,
      },
    },
  ]);

  // 5. Top Tables
  const topTables = await Order.aggregate([
    {
      $match: {
        restaurantId: restaurant._id,
        tableId: { $exists: true, $ne: null },
        createdAt: { $gte: queryStart, $lte: queryEnd },
      },
    },
    { $group: { _id: "$tableId", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "tables",
        localField: "_id",
        foreignField: "_id",
        as: "table",
      },
    },
    { $unwind: "$table" },
    { $project: { _id: 1, tableName: "$table.tableName", count: 1 } },
  ]);

  // 6. Today's Sales specifically for the KPI card
  const todaySalesAgg = await Order.aggregate([
    {
      $match: {
        restaurantId: restaurant._id,
        isPaid: true,
        status: "completed",
        createdAt: { $gte: startOfToday, $lte: endOfToday },
      },
    },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);

  const overview = {
    kpis: {
      allTimeSales: {
        value: allTimeSalesAgg[0]?.total || 0,
        description: "Total revenue to date",
      },
      totalCompletedOrders: {
        value: periodOrdersAgg,
        description: "Orders in selected period",
      },
      thisMonthSales: {
        value: periodSalesAgg[0]?.total || 0,
        description: "Sales in selected period",
      },
      todaySales: {
        value: todaySalesAgg[0]?.total || 0,
        description: "Today's sales revenue",
      },
    },
    salesTrend,
    topFoodItems,
    topTables,
  };

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        overview,
        "Dashboard analytics retrieved successfully"
      )
    );
});
