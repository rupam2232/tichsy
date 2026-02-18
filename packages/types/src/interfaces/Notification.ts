export interface Notification {
  _id: string;
  recipient: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  mergeKey?: string;
  count: number;
  expiresAt: string | Date; // Date objects might come as strings from JSON API
  createdAt: string | Date;
  updatedAt: string | Date;
}
