export type Order = {
  _id: string;
  orderNo: number;
  restaurantId: string;
  status:
    | "pending"
    | "preparing"
    | "ready"
    | "served"
    | "completed"
    | "cancelled";
  totalAmount: number;
  isPaid: boolean;
  externalPlatform?: string;
  table: {
    _id: string;
    tableName: string;
    qrSlug: string;
  };
  orderedFoodItems: OrderFoodItem[];
  createdAt: string;
};

export interface OrderFoodItem {
  foodItemId: string;
  variantName?: string;
  foodName: string;
  foodType: "veg" | "non-veg" | "vegan";
  quantity: number;
  finalPrice: number;
  isVariantOrder: boolean;
}

export interface DetailedFoodItemDetails extends OrderFoodItem {
  price: number;
  firstImageUrl?: string;
  variantDetails?: {
    variantName: string;
    price: number;
    discountedPrice: number;
    isAvailable: boolean;
    _id: string;
  };
}

export type OrderDetails = {
  orders: Order[];
  page: number;
  limit: number;
  totalPages: number;
  totalOrders: number;
} | null;

export interface FullOrderDetailsType {
  _id: string;
  orderNo: number;
  restaurant: {
    _id: string;
    restaurantName: string;
    slug: string;
    address?: string;
  };
  status:
    | "pending"
    | "preparing"
    | "ready"
    | "served"
    | "completed"
    | "cancelled";
  subtotal: number;
  totalAmount: number;
  discountAmount?: number;
  taxAmount?: number;
  taxRate?: number;
  isTaxIncludedInPrice: boolean;
  taxLabel?: string;
  paymentMethod: "cash" | "online";
  isPaid: boolean;
  notes?: string;
  externalOrderId?: string;
  externalPlatform?: string;
  kitchenStaffId?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  kitchenStaff?: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar: string;
    role: string;
  };
  table: {
    _id: string;
    tableName: string;
    qrSlug: string;
  };
  paymentAttempts: [];
  orderedFoodItems: DetailedFoodItemDetails[];
  createdAt: string;
}
