import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import type { accessTokenUser } from "../utils/jwt.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import type { User as UserType } from "../models/user.model.js";
import { DeviceSession } from "../models/deviceSession.model.js";
import { getCookieOptions } from "../utils/cookieOptions.js";
import { env } from "../env.js";
import { Request, Response, NextFunction } from "express";
import requestIp from "request-ip";
const options = getCookieOptions();

export const verifyAuth = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const accessToken =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) throw new ApiError(401, "Unauthorized request");

    const decodedRefreshToken = jwt.verify(
      refreshToken,
      env.REFRESH_TOKEN_SECRET
    );
    if (
      typeof decodedRefreshToken !== "object" ||
      decodedRefreshToken === null ||
      !decodedRefreshToken._id
    ) {
      throw new ApiError(401, "Invalid Refresh Token");
    }
    const userId = decodedRefreshToken._id as accessTokenUser["_id"];
    const deviceSession = await DeviceSession.findOne({
      userId,
      refreshToken,
    });

    if (!deviceSession || deviceSession.revoked) {
      res
        .status(401)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiError(401, "Unauthorized request"));
      return;
    }

    let user: UserType;

    if (!accessToken) {
      user = await User.findById(deviceSession.userId).select("-password -__v");
      if (!user) {
        res
          .status(401)
          .clearCookie("refreshToken", options)
          .json(new ApiError(401, "Unauthorized request"));
        return;
      }

      // Generate new tokens
      const newAccessToken = generateAccessToken({
        _id: user._id.toString(),
        email: user.email,
      });
      const newRefreshToken = generateRefreshToken(user._id.toString());

      // Set new tokens in cookie
      res.cookie("accessToken", newAccessToken, options);
      res.cookie("refreshToken", newRefreshToken, options);

      // Update refresh token of the device session
      deviceSession.refreshToken = newRefreshToken;
    } else {
      const decodedAccessToken = jwt.verify(
        accessToken,
        env.ACCESS_TOKEN_SECRET
      );
      if (
        typeof decodedAccessToken !== "object" ||
        decodedAccessToken === null ||
        !decodedAccessToken._id
      ) {
        res
          .status(401)
          .clearCookie("accessToken", options)
          .clearCookie("refreshToken", options)
          .json(new ApiError(401, "Invalid Access Token"));
        return;
      }
      const decodedToken = decodedAccessToken as accessTokenUser;

      user = await User.findById(decodedToken._id).select("-password -__v");

      if (!user) {
        res
          .status(401)
          .clearCookie("accessToken", options)
          .clearCookie("refreshToken", options)
          .json(new ApiError(401, "Invalid Access Token"));
        return;
      }
    }

    // Update the last active time and other details of the device session
    deviceSession.lastActiveAt = new Date();
    if (deviceSession.ipAddress !== requestIp.getClientIp(req)) {
      deviceSession.ipAddress = requestIp.getClientIp(req) || "Unknown IP";
    }
    if (deviceSession.userAgent !== req.header("user-agent")) {
      deviceSession.userAgent =
        req.header("user-agent") || "Unknown User Agent";
    }
    await deviceSession.save();

    // Attach user to the request object
    req.user = user;
    next();
  }
);

export const verifyOptionalAuth = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const accessToken =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    const refreshToken = req.cookies?.refreshToken;

    let decoded = null;
    if (accessToken) {
      decoded = jwt.verify(accessToken, env.ACCESS_TOKEN_SECRET);
      if (typeof decoded !== "object" || decoded === null) {
        next(); // If the token is invalid, just continue without attaching user
      } else {
        const decodedToken = decoded as accessTokenUser;

        const user: UserType = await User.findById(decodedToken._id).select(
          "-password -__v"
        );

        if (!user) {
          next(); // If user not found, continue without attaching user
        } else {
          const deviceSession = await DeviceSession.findOne({
            userId: user._id,
            refreshToken,
          });

          if (!deviceSession || deviceSession.revoked) {
            // If the device session is not found, or the refresh token does not match, or the session is revoked
            res
              .clearCookie("accessToken", options)
              .clearCookie("refreshToken", options);
          } else {
            // Update the last active time of the device session
            deviceSession.lastActiveAt = new Date();
            if (deviceSession.ipAddress !== requestIp.getClientIp(req)) {
              deviceSession.ipAddress =
                requestIp.getClientIp(req) || "Unknown IP";
            }
            if (deviceSession.userAgent !== req.header("user-agent")) {
              deviceSession.userAgent =
                req.header("user-agent") || "Unknown User Agent";
            }
            await deviceSession.save();

            // Attach user to the request object
            req.user = user;
          }
          next();
        }
      }
    } else {
      // If no access token, just continue without attaching user
      next();
    }
  }
);
