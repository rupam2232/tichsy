import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  markNotificationAsReadByMergeKey,
  deleteNotification as deleteNotificationService,
} from "../service/notification.service.js";

export const getUserNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?._id) {
      throw new ApiError(401, "User not found");
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const data = await getNotifications(req.user._id, page, limit);

    res
      .status(200)
      .json(new ApiResponse(200, data, "Notifications fetched successfully"));
  }
);

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!req.user?._id) {
    throw new ApiError(401, "User not found");
  }
  const updatedNotification = await markNotificationAsRead(id, req.user._id);

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedNotification, "Notification marked as read")
    );
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?._id) {
    throw new ApiError(401, "User not found");
  }
  await markAllNotificationsAsRead(req.user._id);

  res
    .status(200)
    .json(new ApiResponse(200, null, "All notifications marked as read"));
});

export const markReadByMergeKey = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.params || !req.params.key) {
      throw new ApiError(400, "Merge key is required");
    }
    const { key } = req.params;
    if (!req.user?._id) {
      throw new ApiError(401, "User not found");
    }
    const updatedNotification = await markNotificationAsReadByMergeKey(
      key,
      req.user._id
    );
    res
      .status(200)
      .json(
        new ApiResponse(200, updatedNotification, "Notification marked as read")
      );
  }
);

export const deleteNotification = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!req.user?._id) {
      throw new ApiError(401, "User not found");
    }

    const deletedNotification = await deleteNotificationService(
      id,
      req.user._id
    );

    if (!deletedNotification) {
      throw new ApiError(404, "Notification not found");
    }

    res
      .status(200)
      .json(new ApiResponse(200, null, "Notification deleted successfully"));
  }
);
