import { isValidObjectId, Types } from "mongoose";
import { FoodItem } from "../models/foodItem.model.js";
import { Order } from "../models/order.model.js";
import { Restaurant } from "../models/restaurant.models.js";
import { Table } from "../models/table.model.js";
import { canRestaurantRecieveOrders } from "../service/order.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { razorpay } from "../utils/razorpay.js";
import { Payment } from "../models/payment.model.js";
import { startSession } from "mongoose";
import { io } from "../socket/index.js";
import { OrderNoCounter } from "../models/orderNoCounter.model.js";

export const createOrder = asyncHandler(async (req, res, next) => {
  const session = await startSession();
  try {
    session.startTransaction();
    if (!req.params.restaurantSlug || !req.params.tableQrSlug) {
      throw new ApiError(400, "Restaurant slug and table QR slug are required");
    }
    if (
      !req.body.foodItems ||
      !Array.isArray(req.body.foodItems) ||
      req.body.foodItems.length === 0 ||
      !req.body.paymentMethod ||
      !["online", "cash"].includes(req.body.paymentMethod)
    ) {
      throw new ApiError(
        400,
        "All fields are required: foodItems, paymentMethod"
      );
    }

    const restaurant = await Restaurant.findOne({
      slug: req.params.restaurantSlug,
    }).session(session);

    if (!restaurant) {
      throw new ApiError(404, "Restaurant not found");
    }

    if (restaurant.isArchived) {
      throw new ApiError(
        403,
        "Restaurant is archived. Please contact staff or try again later."
      );
    }

    if (restaurant.isCurrentlyOpen === false) {
      throw new ApiError(400, "Restaurant is currently closed");
    }

    let foodItems = [];
    let orderedFoodItems = []; // to send real-time updates with socket.io
    // check if food variants are valid
    for (const foodItem of req.body.foodItems) {
      if (
        !foodItem._id ||
        !foodItem.quantity ||
        typeof foodItem.quantity !== "number"
      ) {
        throw new ApiError(400, "Each food item must have an _id and quantity");
      }
      const isFoodItemValid = await FoodItem.findOne({
        _id: foodItem._id,
        restaurantId: restaurant._id,
        isAvailable: true,
      }).session(session);
      if (!isFoodItemValid) {
        throw new ApiError(
          400,
          `Food item with id ${foodItem._id} is not available`
        );
      }
      if (foodItem.variantName) {
        if (isFoodItemValid.hasVariants === false) {
          throw new ApiError(
            400,
            `${foodItem.foodName} does not have variants`
          );
        }
        const isVariantValid = isFoodItemValid.variants.some(
          (variant) => variant.variantName === foodItem.variantName
        );
        if (!isVariantValid) {
          throw new ApiError(
            400,
            `Variant ${foodItem.variantName} for food item ${foodItem.foodName} is not valid`
          );
        }
        // Ensure the variant is available
        const variant = isFoodItemValid.variants.find(
          (variant) => variant.variantName === foodItem.variantName
        );
        if (!variant || variant.isAvailable === false) {
          throw new ApiError(
            400,
            `Variant ${foodItem.variantName} for food item ${foodItem.foodName} is not available`
          );
        }
      }
      foodItems.push({
        foodItemId: isFoodItemValid._id,
        variantName: foodItem.variantName ?? null, // Ensure variantName is included if provided
        quantity: foodItem.quantity ?? 1, // Default to 1 if quantity is not provided
        price: foodItem.variantName
          ? isFoodItemValid.variants.filter(
              (variant) => variant.variantName === foodItem.variantName
            )[0].price
          : isFoodItemValid.price,
        finalPrice: foodItem.variantName
          ? (isFoodItemValid.variants.filter(
              (variant) => variant.variantName === foodItem.variantName
            )[0].discountedPrice ??
            isFoodItemValid.variants.filter(
              (variant) => variant.variantName === foodItem.variantName
            )[0].price)
          : (isFoodItemValid.discountedPrice ?? isFoodItemValid.price),
      });

      orderedFoodItems.push({
        ...foodItems[foodItems.length - 1],
        foodName: isFoodItemValid.foodName,
        foodType: isFoodItemValid.foodType,
        isVariantOrder:
          isFoodItemValid.variants.filter(
            (variant) => variant.variantName === foodItem.variantName
          ).length > 0,
      });
    }

    const table = await Table.findOne({
      qrSlug: req.params.tableQrSlug,
      restaurantId: restaurant._id,
    }).session(session);

    if (!table) {
      throw new ApiError(404, "Table not found please rescan the QR code");
    }

    if (table.isOccupied) {
      throw new ApiError(
        400,
        "This table is not available for new orders, it is currently occupied"
      );
    }

    await canRestaurantRecieveOrders(restaurant);

    const { paymentMethod, notes, customerName, customerPhone } = req.body;

    const currency = "INR"; // Default currency for payments, can be changed based on requirements

    if (paymentMethod !== "online" && paymentMethod !== "cash") {
      throw new ApiError(
        400,
        "Invalid payment method. Must be 'online' or 'cash'"
      );
    }

    // Calculate total amount from food items
    const subtotal = foodItems.reduce(
      (acc, item) => acc + item.finalPrice * item.quantity,
      0
    ); // Calculate total amount from food items
    const taxAmount = restaurant.isTaxIncludedInPrice
      ? 0
      : (subtotal * restaurant.taxRate) / 100;
    const totalAmount = restaurant.isTaxIncludedInPrice
      ? subtotal
      : subtotal + taxAmount; // Calculate total amount including tax if not included in price
    const discountAmount = foodItems.reduce(
      (acc, item) => acc + (item.price - item.finalPrice) * item.quantity,
      0
    );

    const orderNoCounter = await OrderNoCounter.findOneAndUpdate(
      { restaurantId: restaurant._id },
      { $inc: { orderNo: 1 } },
      { new: true, upsert: true, session }
    );

    const order = await Order.create(
      [
        {
          orderNo: orderNoCounter.orderNo,
          restaurantId: restaurant._id,
          tableId: table._id,
          foodItems,
          subtotal,
          totalAmount,
          taxAmount,
          discountAmount,
          paymentMethod,
          status: "pending", // Default status for new orders
          isPaid: false, // Default to false
          notes,
          customerName,
          customerPhone,
        },
      ],
      { session }
    );

    // Update the table to mark it as occupied and link the current order
    table.isOccupied = true;
    table.currentOrderId = order[0]._id as Types.ObjectId; // Link the current order to the table
    await table.save({ validateBeforeSave: false, session });

    // Emit the new order event to the relevant sockets
    const socketIoOrderData = {
      _id: order[0]._id,
      orderNo: order[0].orderNo,
      restaurantId: restaurant._id,
      status: order[0].status,
      totalAmount: order[0].totalAmount,
      isPaid: order[0].isPaid,
      externalPlatform: order[0].externalPlatform,
      table: {
        _id: table._id,
        tableName: table.tableName,
        qrSlug: table.qrSlug,
        isOccupied: table.isOccupied,
      },
      orderedFoodItems,
      createdAt: order[0].createdAt,
    };

    // If the payment method is online, we can initiate the payment process here
    if (paymentMethod === "online") {
      const payment = await Payment.create(
        [
          {
            orderId: order[0]._id,
            method: paymentMethod,
            status: "pending", // Initial status for new payments
            subtotal,
            totalAmount,
            discountAmount,
            taxAmount,
            tipAmount: 0, // Assuming no tip for now, can be updated later
          },
        ],
        { session }
      );
      // Razorpay integration to create a payment order
      const paymentResponse = await razorpay.orders.create({
        amount: payment[0].totalAmount * 100, // Amount in paise
        currency: currency,
        receipt: `Receipt #${order[0]._id!.toString()}`,
        notes: {
          orderId: order[0]._id!.toString(),
          restaurantSlug: restaurant.slug,
        },
      });
      if (!paymentResponse || !paymentResponse.id) {
        throw new ApiError(500, "Failed to create payment order");
      }
      payment[0].paymentGateway = "Razorpay"; // Set the payment gateway
      payment[0].gatewayOrderId = paymentResponse.id; // Store the Razorpay order ID
      const paymentData = await payment[0].save({ session });
      // Update the order with the payment ID
      order[0].paymentAttempts = order[0].paymentAttempts || []; // Ensure paymentAttempts is an array
      order[0].paymentAttempts.push(paymentData._id as Types.ObjectId); // Add the payment ID to the order's payment attempts
      await order[0].save({ session });
      await session.commitTransaction();
      session.endSession();
      io?.to(`restaurant_${restaurant._id}_staff`).emit("newOrder", {
        order: socketIoOrderData,
        message: "A new order has been placed",
      });
      io?.to(`restaurant_${restaurant._id}_owner`).emit("newOrder", {
        order: socketIoOrderData,
        message: "A new order has been placed",
      });
      res
        .status(201)
        .json(
          new ApiResponse(
            201,
            { order: order[0], paymentData: paymentResponse },
            "Order created successfully"
          )
        );
    } else {
      // For cash payments
      await session.commitTransaction();
      session.endSession();
      io?.to(`restaurant_${restaurant._id}_staff`).emit("newOrder", {
        order: socketIoOrderData,
        message: "A new order has been placed",
      });
      io?.to(`restaurant_${restaurant._id}_owner`).emit("newOrder", {
        order: socketIoOrderData,
        message: "A new order has been placed",
      });
      res
        .status(201)
        .json(
          new ApiResponse(
            201,
            { order: order[0] },
            "Order created successfully"
          )
        );
    }
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    next(error); // asyncHandler will catch and forward this error
  }
});

export const getOrderById = asyncHandler(async (req, res) => {
  if (!req.params.orderId || !req.params.restaurantSlug) {
    throw new ApiError(400, "Order ID and restaurant slug are required");
  }
  const restaurantSlug = req.params.restaurantSlug;
  const orderId = req.params.orderId;

  if (!isValidObjectId(orderId)) {
    throw new ApiError(400, "Invalid order ID format");
  }
  const restaurant = await Restaurant.findOne({ slug: restaurantSlug });
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  const order = await Order.aggregate([
    {
      $match: {
        _id: new Types.ObjectId(orderId),
        restaurantId: restaurant._id,
      },
    },
    {
      $lookup: {
        from: "restaurants",
        localField: "restaurantId",
        foreignField: "_id",
        as: "restaurant",
        pipeline: [
          {
            $project: {
              _id: 1,
              restaurantName: 1,
              slug: 1,
              taxRate: 1,
              isTaxIncludedInPrice: 1,
              taxLabel: 1,
              address: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$restaurant",
    },
    {
      $lookup: {
        from: "tables",
        localField: "tableId",
        foreignField: "_id",
        as: "table",
        pipeline: [
          {
            $project: {
              _id: 1,
              tableName: 1,
              qrSlug: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "payments",
        localField: "_id",
        foreignField: "orderId",
        as: "paymentAttempts",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "kitchenStaffId",
        foreignField: "_id",
        as: "kitchenStaff",
        pipeline: [
          {
            $project: {
              _id: 1,
              firstName: 1,
              lastName: 1,
              role: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: "$kitchenStaff",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: "$table",
    },
    {
      $unwind: "$foodItems",
    },
    // Lookup food item details
    {
      $lookup: {
        from: "fooditems",
        localField: "foodItems.foodItemId",
        foreignField: "_id",
        as: "foodItemDetails",
      },
    },
    // Unwind foodItemDetails (should only be one per foodItemId)
    { $unwind: "$foodItemDetails" },
    // Group back to order structure, but build foodItems array with merged info
    {
      $group: {
        _id: "$_id",
        orderNo: { $first: "$orderNo" },
        restaurant: { $first: "$restaurant" },
        table: { $first: "$table" },
        status: { $first: "$status" },
        subtotal: { $first: "$subtotal" },
        totalAmount: { $first: "$totalAmount" },
        discountAmount: { $first: "$discountAmount" },
        taxAmount: { $first: "$taxAmount" },
        isPaid: { $first: "$isPaid" },
        paymentMethod: { $first: "$paymentMethod" },
        notes: { $first: "$notes" },
        externalOrderId: { $first: "$externalOrderId" },
        externalPlatform: { $first: "$externalPlatform" },
        kitchenStaff: { $first: "$kitchenStaff" },
        kitchenStaffId: { $first: "$kitchenStaffId" },
        customerName: { $first: "$customerName" },
        customerPhone: { $first: "$customerPhone" },
        deliveryAddress: { $first: "$deliveryAddress" },
        createdAt: { $first: "$createdAt" },
        paymentAttempts: { $first: "$paymentAttempts" },
        orderedFoodItems: {
          $push: {
            foodItemId: "$foodItems.foodItemId",
            quantity: "$foodItems.quantity",
            price: "$foodItems.price",
            finalPrice: "$foodItems.finalPrice",
            foodName: "$foodItemDetails.foodName",
            foodType: "$foodItemDetails.foodType",
            firstImageUrl: {
              $cond: {
                if: { $gt: [{ $size: "$foodItemDetails.imageUrls" }, 0] },
                then: { $arrayElemAt: ["$foodItemDetails.imageUrls", 0] },
                else: null,
              },
            }, // Get the first image URL if available
            // check if the food item is a varinat
            isVariantOrder: {
              $cond: [
                { $ne: [{ $ifNull: ["$foodItems.variantName", ""] }, ""] },
                true,
                false,
              ],
            },
            variantDetails: {
              // Get the variant details if variantName is provided
              $cond: {
                if: { $ne: ["$foodItems.variantName", null] },
                then: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$foodItemDetails.variants",
                        as: "variant",
                        cond: {
                          $eq: [
                            "$$variant.variantName",
                            "$foodItems.variantName",
                          ],
                        },
                      },
                    },
                    0,
                  ],
                },
                else: null,
              },
            },
          },
        },
      },
    },
  ]);

  if (!order || order.length === 0) {
    throw new ApiError(404, "Order not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, order[0], "Order retrieved successfully"));
});

export const getOrdersByIds = asyncHandler(async (req, res) => {
  if (!req.query) {
    throw new ApiError(400, "Query parameters are required");
  }

  const { restaurantSlug, orderIds } = req.query;

  if (!restaurantSlug || !orderIds) {
    throw new ApiError(400, "restaurantSlug and orderIds are required");
  }

  if (req.query.limit && isNaN(Number(req.query.limit))) {
    throw new ApiError(400, "Invalid limit parameter");
  }

  if (
    req.query.limit &&
    (Number(req.query.limit) <= 0 || Number(req.query.limit) > 20)
  ) {
    throw new ApiError(400, "Limit must be between 1 and 20");
  }

  // orderIds can be a comma-separated string or an array
  const idsArray = Array.isArray(orderIds)
    ? orderIds
    : typeof orderIds === "string"
      ? orderIds
          .split(",")
          .slice(0, Number(req.query.limit) || 10)
          .map((id: string) => id.trim())
      : [];

  // Validate ObjectIds
  const validIds = idsArray
    .filter((id): id is string => typeof id === "string")
    .filter((id) => isValidObjectId(id));

  if (validIds.length === 0 || validIds.length !== idsArray.length) {
    throw new ApiError(400, "Invalid order IDs provided");
  }

  const restaurant = await Restaurant.findOne({ slug: restaurantSlug });
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  // Query orders by _id and restaurantId
  const orders = await Order.aggregate([
    {
      $match: {
        _id: { $in: validIds.map((id) => new Types.ObjectId(id)) },
        restaurantId: restaurant._id,
      },
    },
    { $unwind: { path: "$foodItems" } },
    {
      $lookup: {
        from: "fooditems",
        localField: "foodItems.foodItemId",
        foreignField: "_id",
        as: "foodItemDetails",
        pipeline: [{ $project: { _id: 1, foodName: 1, foodType: 1 } }],
      },
    },
    { $unwind: { path: "$foodItemDetails" } },
    {
      $group: {
        _id: "$_id",
        orderNo: { $first: "$orderNo" },
        restaurantId: { $first: "$restaurantId" },
        status: { $first: "$status" },
        totalAmount: { $first: "$totalAmount" },
        isPaid: { $first: "$isPaid" },
        externalPlatform: { $first: "$externalPlatform" },
        createdAt: { $first: "$createdAt" },
        orderedFoodItems: {
          $push: {
            foodItemId: "$foodItems.foodItemId",
            variantName: "$foodItems.variantName",
            foodName: "$foodItemDetails.foodName",
            foodType: "$foodItemDetails.foodType",
            quantity: "$foodItems.quantity",
            finalPrice: "$foodItems.finalPrice",
            isVariantOrder: {
              $cond: [
                { $ne: [{ $ifNull: ["$foodItems.variantName", ""] }, ""] },
                true,
                false,
              ],
            },
          },
        },
      },
    },
    { $sort: { createdAt: -1 } },
  ]);

  res
    .status(200)
    .json(new ApiResponse(200, orders, "Orders retrieved successfully"));
});

export const getOrdersByRestaurant = asyncHandler(async (req, res) => {
  if (!req.params.restaurantSlug) {
    throw new ApiError(400, "Restaurant slug is required");
  }

  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = "desc",
    status,
    search = "",
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

  if (req.user?.role === "owner") {
    if (restaurant.ownerId.toString() !== req.user!._id!.toString()) {
      throw new ApiError(
        403,
        "You are not authorized to view orders for this restaurant"
      );
    }
  } else if (req.user?.role === "staff") {
    if (
      !restaurant.staffIds ||
      restaurant.staffIds.length === 0 ||
      !restaurant.staffIds.some(
        (staff) => staff._id.toString() === req.user!._id!.toString()
      )
    ) {
      throw new ApiError(
        403,
        "You are not authorized to view orders for this restaurant"
      );
    }
  }

  const baseMatch: any = {
    restaurantId: restaurant._id,
    ...(req.query.isPaid ? { isPaid: req.query.isPaid === "true" } : {}),
    ...(status
      ? !Array.isArray(status)
        ? { status }
        : status.length > 0
          ? { status: { $in: status } }
          : {}
      : {}),
  };

  let fromDate: Date | undefined;
  let toDate: Date | undefined;

  if (req.query.date === "today") {
    fromDate = new Date();
    fromDate.setHours(0, 0, 0, 0);
    toDate = new Date();
    toDate.setHours(23, 59, 59, 999);
  } else if (req.query.date === "yesterday") {
    fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 1);
    fromDate.setHours(0, 0, 0, 0);
    toDate = new Date();
    toDate.setDate(toDate.getDate() - 1);
    toDate.setHours(23, 59, 59, 999);
  } else if (req.query.date && typeof req.query.date === "string") {
    // If a specific date is provided (e.g. 2025-08-15)
    fromDate = new Date(req.query.date);
    fromDate.setHours(0, 0, 0, 0);
    toDate = new Date(req.query.date);
    toDate.setHours(23, 59, 59, 999);
  } else {
    // Standard from/to logic
    if (req.query.from) {
      fromDate = new Date(req.query.from as string);
      fromDate.setHours(0, 0, 0, 0);
    }
    if (req.query.to) {
      toDate = new Date(req.query.to as string);
      toDate.setHours(23, 59, 59, 999);
    }
  }

  // Only add createdAt filter if at least one date is provided
  if (fromDate || toDate) {
    baseMatch.createdAt = {};
    if (fromDate) baseMatch.createdAt.$gte = fromDate;
    if (toDate) baseMatch.createdAt.$lte = toDate;
  }

  const decodedSearch = decodeURIComponent(search as string).trim();

  const searchMatch = decodedSearch
    ? {
        $or: [
          { "table.tableName": { $regex: decodedSearch, $options: "i" } },
          { "table.qrSlug": { $regex: decodedSearch, $options: "i" } },
          { customerName: { $regex: decodedSearch, $options: "i" } },
          { customerPhone: { $regex: decodedSearch, $options: "i" } },
          { notes: { $regex: decodedSearch, $options: "i" } },
          {
            orderNo: isNaN(Number(decodedSearch)) ? -1 : Number(decodedSearch),
          },
          {
            "foodItemDetails.foodName": {
              $regex: decodedSearch,
              $options: "i",
            },
          },
          { "foodItems.variantName": { $regex: decodedSearch, $options: "i" } },
        ],
      }
    : {};

  const postGroupSearchMatch = decodedSearch
    ? {
        $or: [
          { "table.tableName": { $regex: decodedSearch, $options: "i" } },
          { "table.qrSlug": { $regex: decodedSearch, $options: "i" } },
          { customerName: { $regex: decodedSearch, $options: "i" } },
          { customerPhone: { $regex: decodedSearch, $options: "i" } },
          { notes: { $regex: decodedSearch, $options: "i" } },
          {
            orderNo: isNaN(Number(decodedSearch)) ? -1 : Number(decodedSearch),
          },
          {
            "orderedFoodItems.foodName": {
              $regex: decodedSearch,
              $options: "i",
            },
          },
          {
            "orderedFoodItems.variantName": {
              $regex: decodedSearch,
              $options: "i",
            },
          },
        ],
      }
    : {};

  const sortStage: Record<string, 1 | -1> = {};
  if (sortBy) {
    sortStage[sortBy.toString()] = sortType === "asc" ? 1 : -1;
  }

  sortStage.statusOrder = 1;
  sortStage.orderNo = 1;

  // Main aggregation pipeline for fetching orders
  const aggregationPipeline = [
    { $match: baseMatch },
    {
      $lookup: {
        from: "tables",
        localField: "tableId",
        foreignField: "_id",
        as: "table",
        pipeline: [{ $project: { _id: 1, tableName: 1, qrSlug: 1 } }],
      },
    },
    { $unwind: { path: "$table" } },
    { $unwind: { path: "$foodItems" } },
    {
      $lookup: {
        from: "fooditems",
        localField: "foodItems.foodItemId",
        foreignField: "_id",
        as: "foodItemDetails",
        pipeline: [{ $project: { _id: 1, foodName: 1, foodType: 1 } }],
      },
    },
    { $unwind: { path: "$foodItemDetails" } },
    {
      $group: {
        _id: "$_id",
        orderNo: { $first: "$orderNo" },
        restaurantId: { $first: "$restaurantId" },
        table: { $first: "$table" },
        status: { $first: "$status" },
        totalAmount: { $first: "$totalAmount" },
        isPaid: { $first: "$isPaid" },
        externalPlatform: { $first: "$externalPlatform" },
        createdAt: { $first: "$createdAt" },
        customerName: { $first: "$customerName" },
        customerPhone: { $first: "$customerPhone" },
        notes: { $first: "$notes" },
        orderedFoodItems: {
          $push: {
            foodItemId: "$foodItems.foodItemId",
            variantName: "$foodItems.variantName",
            foodName: "$foodItemDetails.foodName",
            foodType: "$foodItemDetails.foodType",
            quantity: "$foodItems.quantity",
            finalPrice: "$foodItems.finalPrice",
            isVariantOrder: {
              $cond: [
                { $ne: [{ $ifNull: ["$foodItems.variantName", ""] }, ""] },
                true,
                false,
              ],
            },
          },
        },
      },
    },
    ...(decodedSearch ? [{ $match: postGroupSearchMatch }] : []),
    {
      $unset: ["customerName", "customerPhone", "notes"],
    },
    {
      $addFields: {
        statusOrder: {
          $switch: {
            branches: [
              { case: { $eq: ["$status", "pending"] }, then: 1 },
              { case: { $eq: ["$status", "preparing"] }, then: 2 },
              { case: { $eq: ["$status", "ready"] }, then: 3 },
              { case: { $eq: ["$status", "served"] }, then: 4 },
              { case: { $eq: ["$status", "completed"] }, then: 5 },
              { case: { $eq: ["$status", "cancelled"] }, then: 6 },
            ],
            default: 99,
          },
        },
      },
    },
    { $sort: sortStage },
    { $skip: (pageNumber - 1) * limitNumber },
    { $limit: limitNumber },
  ];

  // Count pipeline (up to $group, then count)
  const groupIndex = aggregationPipeline.findIndex(
    (stage) => !!(stage as any).$group
  );
  const countPipeline = [
    ...aggregationPipeline.slice(0, groupIndex),
    ...(decodedSearch ? [{ $match: searchMatch }] : []),
    { $group: { _id: "$_id" } },
    { $count: "total" },
  ];

  const countResult = await Order.aggregate(countPipeline);
  const orderCount = countResult[0]?.total || 0;
  const orders = await Order.aggregate(aggregationPipeline);

  if (!orders || orders.length === 0) {
    res.status(200).json(
      new ApiResponse(
        200,
        {
          orders: [],
          page: pageNumber,
          limit: limitNumber,
          totalPages: 0,
          totalOrders: orderCount,
        },
        "No orders found"
      )
    );
  } else {
    res.status(200).json(
      new ApiResponse(
        200,
        {
          orders,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(orderCount / limitNumber),
          totalOrders: orderCount,
        },
        "Orders retrieved successfully"
      )
    );
  }
});

export const getOrderByTable = asyncHandler(async (req, res) => {
  if (!req.params.restaurantSlug || !req.params.tableQrSlug) {
    throw new ApiError(400, "Restaurant slug and table QR slug are required");
  }

  const restaurant = await Restaurant.findOne({
    slug: req.params.restaurantSlug,
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  if (req.user?.role === "owner") {
    if (restaurant.ownerId.toString() !== req.user!._id!.toString()) {
      throw new ApiError(
        403,
        "You are not authorized to view orders for this restaurant"
      );
    }
  } else if (req.user?.role === "staff") {
    if (
      !restaurant.staffIds ||
      restaurant.staffIds.length === 0 ||
      !restaurant.staffIds.some(
        (staff) => staff._id.toString() === req.user!._id!.toString()
      )
    ) {
      throw new ApiError(
        403,
        "You are not authorized to view orders for this restaurant"
      );
    }
  } else {
    throw new ApiError(
      403,
      "You are not authorized to view orders for this restaurant"
    );
  }

  const table = await Table.findOne({
    restaurantId: restaurant._id,
    qrSlug: req.params.tableQrSlug,
  });

  if (!table) {
    throw new ApiError(404, "Table not found");
  }

  if (!table.currentOrderId) {
    throw new ApiError(404, "No current order found for this table");
  }

  const order = await Order.aggregate([
    {
      $match: {
        _id: table.currentOrderId,
        restaurantId: restaurant._id,
        tableId: table._id,
      },
    },
    {
      $lookup: {
        from: "tables",
        localField: "tableId",
        foreignField: "_id",
        as: "table",
        pipeline: [
          {
            $project: {
              _id: 1,
              tableName: 1,
              qrSlug: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$table",
    },
    { $unwind: "$foodItems" },
    // Lookup food item details
    {
      $lookup: {
        from: "fooditems",
        localField: "foodItems.foodItemId",
        foreignField: "_id",
        as: "foodItemDetails",
        pipeline: [
          {
            $project: {
              _id: 1,
              foodName: 1,
              foodType: 1,
            },
          },
        ],
      },
    },
    // Unwind foodItemDetails (should only be one per foodItemId)
    { $unwind: "$foodItemDetails" },
    // Group back to order structure, but build foodItems array with merged info
    {
      $group: {
        _id: "$_id",
        orderNo: { $first: "$orderNo" },
        restaurantId: { $first: "$restaurantId" },
        table: { $first: "$table" },
        status: { $first: "$status" },
        isPaid: { $first: "$isPaid" },
        externalPlatform: { $first: "$externalPlatform" },
        createdAt: { $first: "$createdAt" },
        orderedFoodItems: {
          $push: {
            foodItemId: "$foodItems.foodItemId",
            variantName: "$foodItems.variantName",
            foodName: "$foodItemDetails.foodName",
            foodType: "$foodItemDetails.foodType",
            // check if the food item is a varinat
            isVariantOrder: {
              $cond: [
                { $ne: [{ $ifNull: ["$foodItems.variantName", ""] }, ""] },
                true,
                false,
              ],
            },
          },
        },
      },
    },
  ]);

  if (!order || order.length === 0) {
    throw new ApiError(404, "No orders found for this table");
  }

  res
    .status(200)
    .json(new ApiResponse(200, order[0], "Order retrieved successfully"));
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  if (!req.params.orderId || !req.params.restaurantSlug) {
    throw new ApiError(400, "Order ID and restaurant slug are required");
  }

  if (!req.body || !req.body.status) {
    throw new ApiError(400, "Status is required");
  }

  const { status } = req.body;

  if (
    !status ||
    ![
      "pending",
      "preparing",
      "ready",
      "served",
      "completed",
      "cancelled",
    ].includes(status)
  ) {
    throw new ApiError(400, "Valid status is required");
  }

  const restaurant = await Restaurant.findOne({
    slug: req.params.restaurantSlug,
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  if (restaurant.isArchived) {
    throw new ApiError(
      403,
      "Restaurant is archived. Please unarchive restaurant to update order status."
    );
  }

  if (req.user?.role === "owner") {
    if (restaurant.ownerId.toString() !== req.user!._id!.toString()) {
      throw new ApiError(
        403,
        "You are not authorized to update orders for this restaurant"
      );
    }
  } else if (req.user?.role === "staff") {
    if (
      !restaurant.staffIds ||
      restaurant.staffIds.length === 0 ||
      !restaurant.staffIds.some(
        (staff) => staff._id.toString() === req.user!._id!.toString()
      )
    ) {
      throw new ApiError(
        403,
        "You are not authorized to update orders for this restaurant"
      );
    }
  } else {
    throw new ApiError(
      403,
      "You are not authorized to update orders for this restaurant"
    );
  }

  const order = await Order.findOne({
    _id: req.params.orderId,
    restaurantId: restaurant._id,
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Check if the status is already set to the requested status
  if (order.status === status) {
    throw new ApiError(400, `Order status is already set to ${status}`);
  }

  // Check if the staff is the one who updated the order before
  if (
    req.user!.role !== "owner" &&
    order.kitchenStaffId &&
    order.kitchenStaffId.toString() !== req.user!._id!.toString()
  ) {
    throw new ApiError(
      403,
      "Only the kitchen staff who updated the order can change its status"
    );
  }

  // Check if the order status can be updated
  if (["completed", "cancelled"].includes(order.status)) {
    throw new ApiError(
      400,
      "Cannot update status of completed or cancelled orders"
    );
  }

  if (status === "cancelled" && order.isPaid) {
    // If the order is cancelled and already paid, we should handle the refund logic here
  }
  // If the order is being marked as completed, ensure it was not already served
  if (status === "completed" && order.status !== "served") {
    throw new ApiError(
      400,
      "Order must be served before it can be marked as completed"
    );
  }

  if (status === "completed" && !order.isPaid) {
    // If the order is being marked as completed, ensure it is paid
    throw new ApiError(
      400,
      "Order must be paid before it can be marked as completed"
    );
  }

  // Update the order status
  order.status = status;
  if (status === "completed") {
    order.isPaid = true; // Automatically mark as paid if completed
  }

  if (!order.kitchenStaffId) {
    order.kitchenStaffId = req.user._id as Types.ObjectId; // Set the kitchen staff who updated the order status
  }

  await order.save();
  // If the order is completed, update the table status
  if (status === "completed" || status === "cancelled") {
    const table = await Table.findOne({ _id: order.tableId });
    if (table) {
      table.isOccupied = false; // Mark the table as not occupied
      table.currentOrderId = undefined; // Clear the current order
      await table.save({ validateBeforeSave: false });
    }
  }

  io?.to(`order_${order._id}`).emit("orderUpdate", order);

  res
    .status(200)
    .json(new ApiResponse(200, order, "Order status updated successfully"));
});

export const updateOrder = asyncHandler(async (req, res, next) => {
  const session = await startSession();
  try {
    session.startTransaction();
    if (!req.params.orderId || !req.params.restaurantSlug) {
      throw new ApiError(400, "Order ID and restaurant slug are required");
    }

    if (!req.body || !req.body.foodItems) {
      throw new ApiError(400, "Food items are required");
    }

    const { foodItems, notes } = req.body;

    if (!foodItems || !Array.isArray(foodItems) || foodItems.length === 0) {
      throw new ApiError(400, "Food items are required");
    }

    const restaurant = await Restaurant.findOne({
      slug: req.params.restaurantSlug,
    }).session(session);

    if (!restaurant) {
      throw new ApiError(404, "Restaurant not found");
    }

    if (restaurant.isArchived) {
      throw new ApiError(
        403,
        "Restaurant is archived. Please unarchive restaurant to update order."
      );
    }

    if (req.user?.role === "owner") {
      if (restaurant.ownerId.toString() !== req.user!._id!.toString()) {
        throw new ApiError(
          403,
          "You are not authorized to update orders for this restaurant"
        );
      }
    } else if (req.user?.role === "staff") {
      if (
        !restaurant.staffIds ||
        restaurant.staffIds.length === 0 ||
        !restaurant.staffIds.some(
          (staff) => staff._id.toString() === req.user!._id!.toString()
        )
      ) {
        throw new ApiError(
          403,
          "You are not authorized to update orders for this restaurant"
        );
      }
    } else {
      throw new ApiError(
        403,
        "You are not authorized to update orders for this restaurant"
      );
    }

    const order = await Order.findOne({
      _id: req.params.orderId,
      restaurantId: restaurant._id,
    }).session(session);

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    // Check if the order is already completed or cancelled
    if (["ready", "served", "completed", "cancelled"].includes(order.status)) {
      throw new ApiError(
        400,
        "Cannot update order that is already completed or cancelled"
      );
    }

    // Validate food items
    let updatedFoodItems = [];
    for (const foodItem of foodItems) {
      if (
        !foodItem._id ||
        !foodItem.quantity ||
        typeof foodItem.quantity !== "number"
      ) {
        throw new ApiError(400, "Each food item must have an _id and quantity");
      }
      const isFoodItemValid = await FoodItem.findOne({
        _id: foodItem._id,
        restaurantId: restaurant._id,
        isAvailable: true,
      }).session(session);
      if (!isFoodItemValid) {
        throw new ApiError(
          400,
          `Food item with id ${foodItem._id} is not available`
        );
      }

      if (foodItem.variantName) {
        if (isFoodItemValid.hasVariants === false) {
          throw new ApiError(
            400,
            `Food item ${foodItem._id} does not have variants`
          );
        }
        const isVariantValid = isFoodItemValid.variants.some(
          (variant) => variant.variantName === foodItem.variantName
        );
        if (!isVariantValid) {
          throw new ApiError(
            400,
            `Variant ${foodItem.variantName} for food item ${foodItem._id} is not valid`
          );
        }
        // Ensure the variant is available
        const variant = isFoodItemValid.variants.find(
          (variant) => variant.variantName === foodItem.variantName
        );
        if (!variant || variant.isAvailable === false) {
          throw new ApiError(
            400,
            `Variant ${foodItem.variantName} for food item ${foodItem._id} is not available`
          );
        }
      }
      updatedFoodItems.push({
        foodItemId: isFoodItemValid._id,
        variantName: foodItem.variantName || null, // Ensure variantName is included if provided
        quantity: foodItem.quantity || 1, // Default to 1 if quantity is not provided
        price: foodItem.variantName
          ? isFoodItemValid.variants.filter(
              (variant) => variant.variantName === foodItem.variantName
            )[0].discountedPrice ||
            isFoodItemValid.variants.filter(
              (variant) => variant.variantName === foodItem.variantName
            )[0].price
          : isFoodItemValid.price,
      });
    }
    // Update the order with new food items and notes
    order.foodItems = updatedFoodItems as typeof order.foodItems;

    order.notes = notes || order.notes; // Update notes if provided, otherwise keep existing notes
    await order.save({ session });

    const subtotal = updatedFoodItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    ); // Calculate total amount from food items

    await Payment.updateMany(
      {
        orderId: order._id,
        status: "pending", // Update only pending payments
      },
      {
        subtotal,
        totalAmount: restaurant.isTaxIncludedInPrice
          ? subtotal
          : subtotal + (subtotal * restaurant.taxRate) / 100, // Calculate total amount including tax if not included in price
        taxAmount: restaurant.isTaxIncludedInPrice
          ? 0
          : (subtotal * restaurant.taxRate) / 100, // Calculate tax amount if not included in price
        discountAmount: 0, // Assuming no discount for now, can be updated later
        tipAmount: 0, // Assuming no tip for now, can be updated later
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res
      .status(200)
      .json(new ApiResponse(200, order, "Order updated successfully"));
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    next(error); // asyncHandler will catch and forward this error
  }
});

export const updatePaidStatus = asyncHandler(async (req, res) => {
  if (!req.params.orderId || !req.params.restaurantSlug) {
    throw new ApiError(400, "Order ID and restaurant slug are required");
  }

  const restaurant = await Restaurant.findOne({
    slug: req.params.restaurantSlug,
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  if (restaurant.isArchived) {
    throw new ApiError(
      403,
      "Restaurant is archived. Please unarchive restaurant to update paid status."
    );
  }

  if (req.user!.role === "owner") {
    if (restaurant.ownerId.toString() !== req.user!._id!.toString()) {
      throw new ApiError(
        403,
        "You are not authorized to update orders for this restaurant"
      );
    }
  } else if (req.user?.role === "staff") {
    if (
      !restaurant.staffIds ||
      restaurant.staffIds.length === 0 ||
      !restaurant.staffIds.some(
        (staff) => staff._id.toString() === req.user!._id!.toString()
      )
    ) {
      throw new ApiError(
        403,
        "You are not authorized to update orders for this restaurant"
      );
    }
  } else {
    throw new ApiError(
      403,
      "You are not authorized to update orders for this restaurant"
    );
  }

  const order = await Order.findOne({
    _id: req.params.orderId,
    restaurantId: restaurant._id,
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.paymentMethod !== "cash") {
    throw new ApiError(400, "Only cash orders can be marked as paid or unpaid");
  }

  // Check if the order is already completed or cancelled
  if (["completed", "cancelled"].includes(order.status)) {
    throw new ApiError(
      400,
      "Cannot update order that is already completed or cancelled"
    );
  }

  // If marking as unpaid, ensure order is not completed
  if (order.isPaid && order.status === "completed") {
    throw new ApiError(400, "Completed orders must be paid");
  }

  // If marking as paid, and order is not completed, we can allow it
  order.isPaid = !order.isPaid;
  if (req.body?.markCompleted && order.isPaid && order.status !== "completed") {
    order.status = "completed"; // Automatically mark as completed if paid
  }

  if (!order.kitchenStaffId) {
    order.kitchenStaffId = req.user!._id as Types.ObjectId; // Set the kitchen staff who updated the order status
  }
  await order.save();

  io?.to(`order_${order._id}`).emit("orderUpdate", order);

  res
    .status(200)
    .json(
      new ApiResponse(200, order, "Order payment status updated successfully")
    );
});
