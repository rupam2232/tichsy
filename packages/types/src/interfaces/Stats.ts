export interface StaffDashboardStats {
  newOrders: number;
  inProgressOrders: number;
  occupiedTables: number;
  freeTables: number;
  todayTotalOrders: number;
  yesterdayTotalOrders: number;
  totalOrderChangePercent: number;
  unPaidCompletedOrders: number;
  readyOrders: number;
}

export interface OwnerDashboardStats {
  kpis: {
    allTimeSales: {
      value: number;
      description: string;
    };
    totalCompletedOrders: {
      value: number;
      description: string;
    };
    thisMonthSales: {
      value: number;
      description: string;
    };
    todaySales: {
      value: number;
      description: string;
    };
  };
  salesTrend: {
    _id: string;
    total: number;
    orders: number;
  }[];
  topFoodItems: {
    _id: string;
    count: number;
    foodName: string;
    firstImageUrl?: string;
    variantName?: string;
  }[];
  topTables: {
    _id: string;
    count: number;
    tableName: string;
  }[];
}

export interface DashboardStats {
  role: "owner" | "staff";
  overview?: OwnerDashboardStats; // Only present if role is 'owner'
  operations: StaffDashboardStats; // Always present
}

export type DashboardOperations = StaffDashboardStats;
export type DashboardAnalytics = OwnerDashboardStats;
