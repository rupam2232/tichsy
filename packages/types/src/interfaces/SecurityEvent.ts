export interface SecurityEventData {
  _id: string;
  userId: string;
  eventType: "new_login" | "password_change" | "signup" | "email_change";
  ipAddress: string;
  userAgent: string;
  isEmailSent: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

export interface SecurityEventsResponse {
  events: SecurityEventData[];
  page: number;
  limit: number;
  totalEvents: number;
  totalPages: number;
}
