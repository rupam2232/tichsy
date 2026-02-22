export interface DashboardOperations {
  newOrders: number;
  preparingOrders: number;
  occupiedTables: number;
  freeTables: number;
  todayTotalOrders: number;
  yesterdayTotalOrders: number;
  totalOrderChangePercent: number;
  unpaidOrders: number;
  readyOrders: number;
}

export interface DashboardAnalytics {
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