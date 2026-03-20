// This file sets up a Socket.IO server with CORS configuration
import { Server } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";
import { accessTokenUser } from "../utils/jwt.js";
import { Restaurant } from "../models/restaurant.model.js";
import { RestaurantMember } from "../models/restaurantMember.model.js";
import { DeviceSession } from "../models/deviceSession.model.js";
import { isValidObjectId } from "mongoose";
import { env } from "../env.js";

let io: Server | null = null;
export function setupSocketIO(server: http.Server) {
  io = new Server(server, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true, // Allow cookies and credentials in CORS requests
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    const cookies = socket.handshake.headers.cookie
      ?.split(";")
      .map((cookie) => cookie.trim());

    const accessToken = cookies
      ?.find((cookie) => cookie.startsWith("accessToken="))
      ?.split("=")[1];

    const refreshToken = cookies
      ?.find((cookie) => cookie.startsWith("refreshToken="))
      ?.split("=")[1];

    socket.data.accessToken = accessToken;
    socket.data.refreshToken = refreshToken;

    if (!accessToken) {
      return socket.disconnect();
    }
    const decoded = jwt.verify(
      accessToken,
      env.ACCESS_TOKEN_SECRET
    ) as accessTokenUser;

    // Join user-specific room
    socket.join(`user_${decoded._id}`);
    console.log(`User ${decoded._id} joined their personal room`);

    // Mark as Online if a refresh token exists
    if (refreshToken) {
      DeviceSession.findOneAndUpdate(
        { userId: decoded._id, refreshToken },
        { $set: { isOnline: true, lastActiveAt: new Date() } }
      ).catch((err) => console.error("Error setting device online:", err));
    }

    socket.on("joinRestaurantRoom", async (activeRestaurantId) => {
      try {
        if (!isValidObjectId(activeRestaurantId)) {
          return socket.disconnect();
        }
        const restaurant = await Restaurant.findById(activeRestaurantId)
          .select("_id ownerId")
          .lean();
        if (!restaurant) return socket.disconnect();
        if (
          !decoded ||
          typeof decoded !== "object" ||
          !decoded._id ||
          !restaurant._id
        ) {
          return socket.disconnect();
        }

        // Check if user is owner
        if (decoded._id === restaurant.ownerId.toString()) {
          socket.join(`restaurant_${activeRestaurantId}`);
          console.log(`User joined ${activeRestaurantId} room`);
          return;
        }

        // Check if user is an active staff member
        const membership = await RestaurantMember.exists({
          userId: decoded._id,
          restaurantId: restaurant._id,
          isArchived: false,
        });

        if (!membership) {
          return socket.disconnect();
        }

        socket.join(`restaurant_${activeRestaurantId}`);
        console.log(`User joined ${activeRestaurantId} room`);
      } catch (err) {
        console.error("Socket authentication error:", err);
        socket.disconnect();
      }
    });

    socket.on("joinOrderRoom", (orderId) => {
      if (!orderId) return;
      if (isValidObjectId(orderId) === false) {
        console.error("Invalid order ID:", orderId);
        return;
      }
      socket.join(`order_${orderId}`);
      socket.data.orderId = orderId;
      console.log(`User joined order room: ${orderId}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      if (refreshToken) {
        DeviceSession.findOneAndUpdate(
          { userId: decoded._id, refreshToken },
          { $set: { isOnline: false, lastActiveAt: new Date() } }
        ).catch((err) => console.error("Error setting device offline:", err));
      }
    });
  });

  io.on("error", (err) => {
    console.error("Socket.IO server error:", err);
  });

  return io;
}
export { io };
