export const buildOrderQuery = (tab: string, search: string): string => {
  switch (tab) {
    case "new":
      return "status=pending";
    case "inProgress":
      return "status=preparing";
    case "ready":
      return "status=ready";
    case "unPaid":
      return "isPaid=false&status=pending,preparing,ready,served";
    case "completed":
      return "status=completed";
    case "search":
      return `search=${encodeURIComponent(search)}`;
    default:
      return "";
  }
};
