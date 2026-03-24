// Defines the Order schema and model for MongoDB using Mongoose
import { Schema, model, Document, Types, Query } from "mongoose";

type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "served"
  | "completed"
  | "cancelled";

export interface TableDetails extends Document {
  tableId: Types.ObjectId; // Reference to the Table
  tableName: string;
  qrSlug: string;
}

const tableDetailsSchema: Schema<TableDetails> = new Schema({
  tableId: {
    type: Schema.Types.ObjectId,
    ref: "Table",
    required: [true, "Table id is required"],
    immutable: true,
  },
  tableName: {
    type: String,
    required: [true, "Table name is required"],
    trim: true,
    immutable: true,
  },
  qrSlug: {
    type: String,
    required: [true, "Table qrSlug is required"],
    immutable: true,
  },
});
export interface SelectedAddOn extends Document {
  groupTitle: string;
  optionName: string;
  price: number;
}

const selectedAddOnSchema: Schema<SelectedAddOn> = new Schema({
  groupTitle: { type: String, required: true },
  optionName: { type: String, required: true },
  price: { type: Number, required: true },
});

/**
 * TypeScript interface for a FoodItem subdocument.
 * Represents a single food item (and optional variant) in an order.
 */
export interface FoodItem extends Document {
  foodItemId: Types.ObjectId; // Reference to the FoodItem
  foodName: string; // Snapshot of food name at order time
  foodType: "veg" | "non-veg"; // Snapshot of food type at order time
  foodCategory: string; // Snapshot of category at order time
  variantName?: string; // Name of the variant (if any)
  quantity: number; // Quantity ordered
  price: number; // Base price of the food item (before any discounts)
  finalPrice: number; // Final price after any discounts or adjustments
  selectedAddOns?: SelectedAddOn[]; // Snapshot of selected addons
}

/**
 * Mongoose schema for the FoodItem subdocument.
 */
const foodItemSchema: Schema<FoodItem> = new Schema({
  foodItemId: {
    type: Schema.Types.ObjectId,
    ref: "FoodItem",
    required: [true, "Food item's id is required"],
  },
  foodName: {
    type: String,
    required: [true, "Food name is required"],
    trim: true,
  },
  foodType: {
    type: String,
    enum: ["veg", "non-veg"],
    required: [true, "Food type is required"],
  },
  foodCategory: {
    type: String,
    trim: true,
    default: "Uncategorized",
  },
  variantName: {
    type: String,
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
  },
  finalPrice: {
    type: Number,
    required: [true, "Final price is required"],
    validate: {
      validator: function (value: number) {
        return value >= 0; // Final price should not be negative
      },
      message: "Final price must be a non-negative number",
    },
  },
  selectedAddOns: {
    type: [selectedAddOnSchema],
    default: [],
  },
});

/**
 * TypeScript interface for an Order document.
 * Represents a customer's order in the restaurant.
 */
export interface Order extends Document {
  orderNo: number; // Sequential order number unique per restaurant
  restaurantId: Types.ObjectId; // Reference to the Restaurant
  table: TableDetails; // Snapshot of table details at order time
  foodItems: FoodItem[]; // Array of ordered food items
  status: OrderStatus; // Order status (pending, preparing, etc.)
  subtotal: number; // Amount for only food items (before tax, discount, tip)
  totalAmount: number; // Final amount to be paid (after discount, tax, tip, if any)
  discountAmount?: number; // Amount deducted due to discount (if any)
  taxAmount?: number; // Optional total tax applied (if any)
  taxRate?: number; // Optional tax rate applied (if any)
  taxLabel?: string; // Optional tax label (if any)
  isTaxIncludedInPrice?: boolean; // Optional flag to check if tax is included in price
  paymentMethod?: "online" | "cash"; // Optional payment method used (e.g., cash, card, online)
  paymentAttempts?: Types.ObjectId[]; // Optional array of payment attempt IDs
  isPaid: boolean; // Whether the order is paid
  notes?: string; // Optional notes for the order
  couponUsed?: Types.ObjectId; // Optional reference to the coupon code used
  externalOrderId?: string; // Optional external/third-party order ID
  externalPlatform?: string; // Optional name of the external platform (e.g., Zomato, Swiggy)
  kitchenStaffId?: Types.ObjectId; // Optional reference to the kitchen staff handling the order
  customerName?: string; // Optional name of the customer for external orders
  customerPhone?: string; // Optional phone number of the customer for external orders
  deliveryAddress?: string; // Optional delivery address of the customer for external orders
  createdAt: Date; // Timestamp when the document was first created (set automatically, never changes)
  updatedAt?: Date; // Timestamp when the document was last updated (set automatically, updates on modification)
}

/**
 * Mongoose schema for the Order collection.
 */
const orderSchema: Schema<Order> = new Schema(
  {
    orderNo: {
      type: Number,
      required: [true, "Order number is required"],
      index: true, // Index for faster queries
      immutable: true,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: [true, "Restaurant id is required"],
      immutable: true,
    },
    table: {
      type: tableDetailsSchema,
      required: [true, "Table details are required"],
      immutable: true,
    },
    foodItems: {
      type: [foodItemSchema],
      required: [true, "Food items are required"],
      validate: {
        validator: function (arr: FoodItem[]) {
          return Array.isArray(arr) && arr.length > 0;
        },
        message: "Order must contain at least one food item",
      },
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: [
        "pending",
        "preparing",
        "ready",
        "served",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },
    subtotal: {
      type: Number,
      required: [true, "Sub total is required"],
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    taxRate: {
      type: Number,
      default: 0,
    },
    taxLabel: {
      type: String,
    },
    isTaxIncludedInPrice: {
      type: Boolean,
    },
    paymentMethod: {
      type: String,
      enum: ["online", "cash"],
    },
    paymentAttempts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Payment",
      },
    ],
    isPaid: {
      type: Boolean,
      required: [true, "Is paid is required"],
      default: false,
    },
    notes: String,
    couponUsed: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
    },
    externalOrderId: {
      type: String,
      immutable: true,
    },
    externalPlatform: {
      type: String,
      immutable: true,
    },
    kitchenStaffId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    customerName: {
      type: String,
      immutable: true,
    },
    customerPhone: {
      type: String,
      immutable: true,
    },
    deliveryAddress: {
      type: String,
      immutable: true,
    },
    createdAt: {
      type: Date,
      immutable: true,
    },
  },
  {
    timestamps: true,
  }
);

const TERMINAL_ORDER_STATUSES: OrderStatus[] = ["completed", "cancelled"];

async function blockMutationForTerminalOrder(
  query: Query<unknown, Order>
): Promise<void> {
  const filter = query.getFilter();
  const terminalOrder = await query.model
    .findOne({
      ...filter,
      status: { $in: TERMINAL_ORDER_STATUSES },
    })
    .select("_id")
    .lean();

  if (terminalOrder) {
    throw new Error("Completed or cancelled orders are immutable");
  }
}

orderSchema.pre("save", async function (next) {
  if (this.isNew) return next();

  const existingOrder = await Order.findById(this._id).select("status").lean();
  if (
    existingOrder &&
    TERMINAL_ORDER_STATUSES.includes(existingOrder.status as OrderStatus)
  ) {
    return next(new Error("Completed or cancelled orders are immutable"));
  }

  next();
});

orderSchema.pre("findOneAndUpdate", async function (next) {
  try {
    await blockMutationForTerminalOrder(this as Query<unknown, Order>);
    next();
  } catch (error) {
    next(error as Error);
  }
});

orderSchema.pre("updateOne", async function (next) {
  try {
    await blockMutationForTerminalOrder(this as Query<unknown, Order>);
    next();
  } catch (error) {
    next(error as Error);
  }
});

orderSchema.pre("updateMany", async function (next) {
  try {
    await blockMutationForTerminalOrder(this as Query<unknown, Order>);
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Compound index to ensure all order no. are unique per restaurant id.
 * Allows the order no. to be used by different restaurants, but only once per restaurant id.
 */
orderSchema.index({ restaurantId: 1, orderNo: 1 }, { unique: true});

orderSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, isPaid: 1, status: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, "table.tableId": 1 });

/**
 * Mongoose model for the Order schema.
 */
export const Order = model<Order>("Order", orderSchema);
