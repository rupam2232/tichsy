export interface InvitationType {
  _id: string;
  email: string;
  restaurantId: {
    _id: string;
    restaurantName: string;
    logoUrl?: string;
  };
  role: string;
  token: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}
