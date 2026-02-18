import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import type { accessTokenUser } from "../utils/jwt.js";
import type { User as UserType } from "../models/user.model.js";
import { DeviceSession } from "../models/deviceSession.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getCookieOptions } from "../utils/cookieOptions.js";
import { env } from "../env.js";
import { Request, Response, NextFunction } from "express";
const options = getCookieOptions();

export const verifyAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const accessToken =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) throw new ApiError(401, "Unauthorized request");
  if (!accessToken) throw new ApiError(401, "Invalid Access Token");

  const decoded = jwt.verify(accessToken, env.ACCESS_TOKEN_SECRET);
  if (typeof decoded !== "object" || decoded === null) {
    throw new ApiError(401, "Invalid Access Token");
  }
  const decodedToken = decoded as accessTokenUser;

  const user: UserType = await User.findById(decodedToken._id).select(
    "-password -__v"
  );

  if (!user) {
    throw new ApiError(401, "Invalid Access Token");
  }

  // Find session by refresh token
  const deviceSession = await DeviceSession.findOne({
    userId: user._id,
    refreshToken,
  });

  if (!deviceSession || deviceSession.revoked) {
    res
      .status(401)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(401, null, "Unauthorized request", false));
    return;
  }
  // Update the last active time of the device session
  deviceSession.lastActiveAt = new Date();
  await deviceSession.save();

  // Attach user to the request object

  req.user = user;
  next();
});

export const verifyOptionalAuth = asyncHandler(async (req, res, next) => {
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
});
