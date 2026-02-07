// This file sets up a Socket.IO server with CORS configuration
import { Server } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";
import { accessTokenUser } from "../utils/jwt.js";
import { Restaurant } from "../models/restaurant.models.js";
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
    socket.data.accessToken = accessToken;

    socket.on("authenticate", async (activeRestaurantId) => {
      try {
        if (!accessToken) {
          return socket.disconnect();
        }
        const decoded = jwt.verify(
          accessToken,
          env.ACCESS_TOKEN_SECRET
        ) as accessTokenUser;
        const restaurant = await Restaurant.findById(activeRestaurantId);
        if (!restaurant) return socket.disconnect();
        if (
          !decoded ||
          typeof decoded !== "object" ||
          !decoded._id ||
          !restaurant._id
        ) {
          return socket.disconnect();
        }

        if (decoded.role === "owner") {
          if (decoded._id !== restaurant.ownerId.toString()) {
            return socket.disconnect();
          }
          socket.join(`restaurant_${activeRestaurantId}_owner`);
        } else if (decoded.role === "staff") {
          if (
            !restaurant.staffIds?.some(
              (staff) => staff._id.toString() === decoded._id
            )
          ) {
            return socket.disconnect();
          }
          socket.join(`restaurant_${activeRestaurantId}_staff`);
        } else if (decoded.role === "admin") {
          socket.join(`restaurant_${activeRestaurantId}_admin`);
        } else {
          return socket.disconnect();
        }

        // socket.data.restaurantId = restaurantId; // Store for later use
        console.log(`User joined ${activeRestaurantId} room`);
      } catch (err) {
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
    });
  });

  io.on("error", (err) => {
    console.error("Socket.IO server error:", err);
  });

  return io;
}
export { io };
