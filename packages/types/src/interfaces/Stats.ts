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
  // paymentBreakdown: {
  //   _id: string;
  //   count: number;
  //   total: number;
  // }[];
  //   recentOrders: [
  //     {
  //       _id: "68ab7033d1e3c2f7b614ca7f";
  //       orderNo: 40;
  //       status: "pending";
  //       totalAmount: 100;
  //       createdAt: "2025-08-24T20:04:03.815Z";
  //     },
  //     {
  //       _id: "68ab6d0ad1e3c2f7b614c966";
  //       orderNo: 39;
  //       status: "completed";
  //       totalAmount: 290;
  //       createdAt: "2025-08-24T19:50:34.519Z";
  //     },
  //     {
  //       _id: "68ab51a766afe99afdc63325";
  //       orderNo: 38;
  //       status: "pending";
  //       totalAmount: 200;
  //       createdAt: "2025-08-24T17:53:43.178Z";
  //     },
  //     {
  //       _id: "68aa47b36445eb97dd591585";
  //       orderNo: 37;
  //       status: "ready";
  //       totalAmount: 245;
  //       createdAt: "2025-08-23T22:58:59.148Z";
  //     },
  //     {
  //       _id: "68aa4651eb7ae7b90690a828";
  //       orderNo: 36;
  //       status: "cancelled";
  //       totalAmount: 450;
  //       createdAt: "2025-08-23T22:53:05.946Z";
  //     },
  //   ];
}
