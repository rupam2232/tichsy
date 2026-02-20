import { Notification } from "../models/notification.model.js";
import { io } from "../socket/index.js";
import { Types } from "mongoose";

export const createNotification = async (data: {
  recipient: string | Types.ObjectId;
  type: Notification["type"];
  title: string;
  message: string;
  data?: any;
  mergeKey?: string;
  expiresAt?: Date;
  pluralTitle?: string;
  pluralMessage?: string;
}) => {
  const {
    recipient,
    type,
    title,
    message,
    data: metadata,
    mergeKey,
    expiresAt,
    pluralTitle,
    pluralMessage,
  } = data;

  // Default expiration to 15 days if not provided
  const expirationDate =
    expiresAt || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

  let notification;

  if (mergeKey) {
    // Check for existing unread notification to merge
    notification = await Notification.findOne({
      recipient,
      type,
      mergeKey,
      read: false,
    });

    if (notification) {
      // Merge logic: increment count, update message/title if needed, update timestamp
      notification.count += 1;

      // Update title if pluralTitle is provided
      if (pluralTitle) {
        notification.title = pluralTitle.replace(
          "{count}",
          notification.count.toString()
        );
      } else {
        notification.title = title;
      }

      // Update message if pluralMessage is provided
      if (pluralMessage) {
        notification.message = pluralMessage.replace(
          "{count}",
          notification.count.toString()
        );
      } else {
        notification.message = message;
      }
      notification.data = { ...notification.data, ...metadata }; // Merge metadata
      await notification.save();
    }
  }

  if (!notification) {
    notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      data: metadata,
      read: false,
      mergeKey,
      count: 1,
      expiresAt: expirationDate,
    });
  }

  // Emit socket event
  if (io) {
    io.to(`user_${recipient.toString()}`).emit(
      "new_notification",
      notification
    );
  }

  return notification;
};

export const getNotifications = async (
  userId: string | Types.ObjectId,
  page: number = 1,
  limit: number = 20
) => {
  const notifications = await Notification.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Notification.countDocuments({ recipient: userId });
  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    read: false,
  });

  return {
    notifications,
    total,
    unreadCount,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
};

export const markNotificationAsRead = async (
  notificationId: string,
  userId: string | Types.ObjectId
) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { read: true },
    { new: true }
  );
  return notification;
};

export const markAllNotificationsAsRead = async (
  userId: string | Types.ObjectId
) => {
  await Notification.updateMany(
    { recipient: userId, read: false },
    { read: true }
  );
  return true;
};

export const markNotificationAsReadByMergeKey = async (
  mergeKey: string,
  userId: string | Types.ObjectId
) => {
  const notification = await Notification.findOneAndUpdate(
    { mergeKey, recipient: userId, read: false },
    { read: true },
    { new: true }
  );
  return notification;
};

export const deleteNotification = async (
  notificationId: string,
  userId: string | Types.ObjectId
) => {
  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId,
  });
  return notification;
};
