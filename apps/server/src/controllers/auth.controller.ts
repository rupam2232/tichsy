import { User } from "../models/user.model.js";
import { SecurityEvent } from "../models/securityEvent.model.js";
import { DeviceSession } from "../models/deviceSession.model.js";
import { NextFunction, Request, Response } from "express";
import { startSession } from "mongoose";
import requestIp from "request-ip";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import { Subscription } from "../models/subscription.model.js";
import { SubscriptionHistory } from "../models/subscriptionHistory.model.js";
import sendEmail from "../utils/sendEmail.js";
import {
  newLoginDevice,
  passwordUpdateSuccess,
  welcome,
} from "../templates/emailTemplates.js";
import { OAuth2Client } from "google-auth-library";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getCookieOptions } from "../utils/cookieOptions.js";
import { signUpSchema, signInSchema, forgotPasswordSchema } from "@repo/types";
import { env } from "../env.js";
import crypto from "crypto";
import { createNotification } from "../service/notification.service.js";
import { parseDeviceInfo } from "../utils/deviceParser.js";

const options = getCookieOptions();

// Handles user registration with email/password, device/session logging, security event, and trial subscription creation. Sends welcome email and sets auth cookies.
export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.body) {
    throw new ApiError(400, "Request body is required");
  }
  // Start a MongoDB session for transaction
  const session = await startSession();
  try {
    session.startTransaction();
    const validatedData = signUpSchema.parse(req.body);
    const { email, password, fullName, timezone: bodyTimezone } = validatedData;
    const deviceId = req.cookies.deviceId || crypto.randomUUID();

    // Prevent duplicate users
    const isUserExists = await User.findOne({ email }).session(session);

    if (isUserExists) {
      throw new ApiError(400, "User already exists");
    }

    // Split full name into first and last names
    const [firstName, ...lastNameParts] = fullName.split(" ");
    const lastName = lastNameParts.join(" ");

    const userAgentRaw = req.header("user-agent") || "";
    const ipAddressRaw = requestIp.getClientIp(req) || "";
    const deviceInfo = parseDeviceInfo(userAgentRaw, ipAddressRaw);

    // Create user document
    const user = await User.create(
      [
        {
          email,
          password,
          firstName,
          lastName,
          timezone: bodyTimezone || deviceInfo.timezone,
        },
      ],
      {
        session,
      }
    );

    // Generate JWT tokens for authentication
    const refreshToken = generateRefreshToken(user[0]._id.toString());
    const accessToken = generateAccessToken({
      _id: user[0]._id.toString(),
      email: user[0].email,
      firstName: user[0].firstName,
    });

    await Promise.all([
      Subscription.create(
        [
          {
            userId: user[0]._id,
            plan: "starter",
            isSubscriptionActive: true,
          },
        ],
        { session }
      ),
      SubscriptionHistory.create(
        [
          {
            userId: user[0]._id,
            amount: 0,
            plan: "starter",
            action: "create",
            subtotal: 0,
            discountAmount: 0,
            taxAmount: 0,
            totalAmount: 0,
          },
        ],
        { session }
      ),
      DeviceSession.create(
        [
          {
            userId: user[0]._id,
            deviceId,
            ipAddress: ipAddressRaw || "Unknown IP",
            userAgent: userAgentRaw || "Unknown User Agent",
            deviceInfo,
            refreshToken,
          },
        ],
        { session }
      ),
      SecurityEvent.create(
        [
          {
            userId: user[0]._id,
            eventType: "signup",
            ipAddress: ipAddressRaw || "Unknown IP",
            userAgent: userAgentRaw || "Unknown User Agent",
            metadata: { deviceInfo },
            isEmailSent: true,
          },
        ],
        { session }
      ),
    ]);

    // Commit transaction to save all changes atomically
    await session.commitTransaction();
    session.endSession();

    // Send welcome email (non-blocking)
    sendEmail(email, welcome({ USER_NAME: user[0].firstName }));

    // Send Welcome Notification to UI
    createNotification({
      recipient: user[0]._id,
      type: "system",
      title: "Welcome to Tichsy",
      message:
        "Your account has been successfully created. We're glad to have you. Explore the features and enjoy the platform",
    });

    res
      .status(201)
      .cookie("accessToken", accessToken, {
        ...options,
        maxAge: env.ACCESS_TOKEN_EXPIRY * 24 * 60 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        ...options,
        maxAge: env.REFRESH_TOKEN_EXPIRY * 24 * 60 * 60 * 1000,
      })
      .cookie("deviceId", deviceId, {
        ...options,
        maxAge: 10 * 365 * 24 * 60 * 60 * 1000,
      })
      .json(
        new ApiResponse(
          201,
          {
            _id: user[0]._id,
            email: user[0].email,
            firstName: user[0].firstName,
            lastName: user[0].lastName || "",
            avatar: user[0].avatar || "",
          },
          "Sign up successful"
        )
      );
  } catch (err) {
    // Rollback transaction on error
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    next(err);
  }
};

// Handles user login, device session management, security event logging, and sets auth cookies
export const signin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Start a MongoDB session for transaction
  const session = await startSession();
  try {
    session.startTransaction();
    const validatedData = signInSchema.parse(req.body);
    const { email, password } = validatedData;
    const deviceId = req.cookies.deviceId || crypto.randomUUID();

    const userAgentRaw = req.header("user-agent") || "";
    const ipAddressRaw = requestIp.getClientIp(req) || "";
    const deviceInfo = parseDeviceInfo(userAgentRaw, ipAddressRaw);

    // Find user by email and check password
    const user = await User.findOne({ email }).session(session);

    if (!user || !(await user.isPasswordCorrect(password))) {
      throw new ApiError(401, "Invalid credentials");
    }

    // Generate JWT tokens for authentication
    const refreshToken = generateRefreshToken(user._id.toString());
    const accessToken = generateAccessToken({
      _id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
    });

    // Check for existing device session for this user/device
    const deviceSession = await DeviceSession.findOne({
      userId: user._id,
      deviceId,
    }).session(session);

    if (deviceSession) {
      // Update session with new refresh token, revoked status and last active time
      deviceSession.revoked = false;
      deviceSession.refreshToken = refreshToken;
      deviceSession.previousRefreshToken = undefined;
      deviceSession.previousTokenExpiresAt = undefined;
      deviceSession.lastActiveAt = new Date();
      await deviceSession.save();
    } else {
      await Promise.all([
        DeviceSession.create(
          [
            {
              userId: user._id,
              deviceId,
              ipAddress: ipAddressRaw || "Unknown IP",
              userAgent: userAgentRaw || "Unknown User Agent",
              deviceInfo,
              refreshToken,
            },
          ],
          { session }
        ),
        SecurityEvent.create(
          [
            {
              userId: user._id,
              eventType: "new_login",
              ipAddress: ipAddressRaw || "Unknown IP",
              userAgent: userAgentRaw || "Unknown User Agent",
              metadata: { deviceInfo },
              isEmailSent: true,
            },
          ],
          { session }
        ),
      ]);

      sendEmail(
        email,
        newLoginDevice({
          USER_NAME: user.firstName,
          DEVICE: `${deviceInfo.os} - ${deviceInfo.browser}`,
          LOCATION: deviceInfo.location,
        })
      );

      createNotification({
        recipient: user._id,
        type: "security",
        title: "New Login Detected",
        message: `We noticed a new login from ${deviceInfo.os} - ${deviceInfo.browser} (${deviceInfo.location}). Please verify it was you.`,
      });
    }

    // Commit transaction and end session
    await session.commitTransaction();
    session.endSession();

    res
      .status(200)
      .cookie("accessToken", accessToken, {
        ...options,
        maxAge: env.ACCESS_TOKEN_EXPIRY * 24 * 60 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        ...options,
        maxAge: env.REFRESH_TOKEN_EXPIRY * 24 * 60 * 60 * 1000,
      })
      .cookie("deviceId", deviceId, {
        ...options,
        maxAge: 10 * 365 * 24 * 60 * 60 * 1000,
      })
      .json(
        new ApiResponse(
          200,
          {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName || "",
            avatar: user.avatar || "",
          },
          "Sign in successful"
        )
      );
  } catch (err) {
    // Rollback transaction on error
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    next(err);
  }
};

// Handles Google OAuth sign-in and sign-up, manages device/session/subscription, logs security events, sends emails, and sets auth cookies
export const google = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Start a MongoDB session for transaction
  const session = await startSession();
  try {
    session.startTransaction();
    const deviceId = req.cookies.deviceId || crypto.randomUUID();
    // Verify Google ID token from request
    const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
    // Check if ID token is provided
    if (!req?.body?.idToken) {
      throw new ApiError(400, "Please provide a Google ID token to continue");
    }
    const { idToken } = req.body;
    // Verify the ID token with Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new ApiError(400, "Invalid Google ID token");
    }
    const {
      sub: googleId,
      email,
      given_name,
      family_name,
      picture,
      name,
      email_verified,
    } = payload;

    const userAgentRaw = req.header("user-agent") || "";
    const ipAddressRaw = requestIp.getClientIp(req) || "";
    const deviceInfo = parseDeviceInfo(userAgentRaw, ipAddressRaw);

    // Check if email is verified by Google
    if (!email_verified) {
      throw new ApiError(400, "Email not verified by Google");
    }

    // Check if user already exists in the database
    const user = await User.findOne({ email }).session(session);

    if (user) {
      // Update user details if they are missing
      user.firstName =
        user.firstName ?? (given_name || name?.split(" ")[0] || "");
      user.lastName =
        user.lastName ?? (family_name || name?.split(" ")[1] || "");
      user.avatar = user.avatar ?? (picture || undefined);
      user.oauthId = googleId;
      user.oauthProvider = "google";
      await user.save({ session });

      // Existing user: generate tokens and manage device session
      const refreshToken = generateRefreshToken(user._id.toString());
      const accessToken = generateAccessToken({
        _id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
      });

      // Check for existing device session for this user/device
      const deviceSession = await DeviceSession.findOne({
        userId: user._id,
        deviceId,
      }).session(session);

      if (deviceSession) {
        // Update session with new refresh token, revoked status and last active time
        deviceSession.refreshToken = refreshToken;
        deviceSession.previousRefreshToken = undefined;
        deviceSession.previousTokenExpiresAt = undefined;
        deviceSession.revoked = false;
        deviceSession.lastActiveAt = new Date();
        await deviceSession.save();
      } else {
        // Parallelize independent operations
        await Promise.all([
          DeviceSession.create(
            [
              {
                userId: user._id,
                deviceId,
                ipAddress: ipAddressRaw || "Unknown IP",
                userAgent: userAgentRaw || "Unknown User Agent",
                deviceInfo,
                refreshToken,
              },
            ],
            { session }
          ),
          SecurityEvent.create(
            [
              {
                userId: user._id,
                eventType: "new_login",
                ipAddress: ipAddressRaw || "Unknown IP",
                userAgent: userAgentRaw || "Unknown User Agent",
                metadata: { deviceInfo },
                isEmailSent: true,
              },
            ],
            { session }
          ),
        ]);

        // Fire-and-forget side effects
        sendEmail(
          email,
          newLoginDevice({
            USER_NAME: user.firstName,
            DEVICE: `${deviceInfo.os} - ${deviceInfo.browser}`,
            LOCATION: deviceInfo.location,
          })
        );

        createNotification({
          recipient: user._id,
          type: "security",
          title: "New Login Detected",
          message: `We noticed a new login from ${deviceInfo.os} - ${deviceInfo.browser} (${deviceInfo.location}). Please verify it was you.`,
        });
      }

      // Commit transaction and end session
      await session.commitTransaction();
      session.endSession();

      res
        .status(200)
        .cookie("accessToken", accessToken, {
          ...options,
          maxAge: env.ACCESS_TOKEN_EXPIRY * 24 * 60 * 60 * 1000,
        })
        .cookie("refreshToken", refreshToken, {
          ...options,
          maxAge: env.REFRESH_TOKEN_EXPIRY * 24 * 60 * 60 * 1000,
        })
        .cookie("deviceId", deviceId, {
          ...options,
          maxAge: 10 * 365 * 24 * 60 * 60 * 1000,
        })
        .json(
          new ApiResponse(
            200,
            {
              _id: user._id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName || "",
              avatar: user.avatar || "",
            },
            "Google Sign in successful"
          )
        );
    } else {
      // New user: create user and all related records
      const user = await User.create(
        [
          {
            email,
            firstName: given_name || name?.split(" ")[0],
            lastName: family_name || name?.split(" ")[1] || "",
            oauthProvider: "google",
            oauthId: googleId,
            avatar: picture || undefined,
            timezone: req.body?.timezone || deviceInfo.timezone,
          },
        ],
        { session }
      );

      // Generate tokens for new user
      const refreshToken = generateRefreshToken(user[0]._id.toString());
      const accessToken = generateAccessToken({
        _id: user[0]._id.toString(),
        email: user[0].email,
        firstName: user[0].firstName,
      });

      await Promise.all([
        Subscription.create(
          [
            {
              userId: user[0]._id,
              plan: "starter",
              isSubscriptionActive: true,
            },
          ],
          { session }
        ),
        SubscriptionHistory.create(
          [
            {
              userId: user[0]._id,
              amount: 0,
              plan: "starter",
              action: "create",
              subtotal: 0,
              discountAmount: 0,
              taxAmount: 0,
              totalAmount: 0,
            },
          ],
          { session }
        ),
        DeviceSession.create(
          [
            {
              userId: user[0]._id,
              deviceId,
              ipAddress: ipAddressRaw || "Unknown IP",
              userAgent: userAgentRaw || "Unknown User Agent",
              deviceInfo,
              refreshToken,
            },
          ],
          { session }
        ),
        SecurityEvent.create(
          [
            {
              userId: user[0]._id,
              eventType: "signup",
              ipAddress: ipAddressRaw || "Unknown IP",
              userAgent: userAgentRaw || "Unknown User Agent",
              metadata: { deviceInfo },
              isEmailSent: true,
            },
          ],
          { session }
        ),
      ]);

      // Commit transaction and end session
      await session.commitTransaction();
      session.endSession();

      // Send signup success email (non-blocking)
      sendEmail(email, welcome({ USER_NAME: user[0].firstName }));

      // Send Welcome Notification to UI
      createNotification({
        recipient: user[0]._id,
        type: "system",
        title: "Welcome to Tichsy",
        message:
          "Your account has been successfully created. We're glad to have you. Explore the features and enjoy the platform",
      });

      res
        .status(201)
        .cookie("accessToken", accessToken, {
          ...options,
          maxAge: env.ACCESS_TOKEN_EXPIRY * 24 * 60 * 60 * 1000,
        })
        .cookie("refreshToken", refreshToken, {
          ...options,
          maxAge: env.REFRESH_TOKEN_EXPIRY * 24 * 60 * 60 * 1000,
        })
        .cookie("deviceId", deviceId, {
          ...options,
          maxAge: 10 * 365 * 24 * 60 * 60 * 1000,
        })
        .json(
          new ApiResponse(
            201,
            {
              _id: user[0]._id,
              email: user[0].email,
              firstName: user[0].firstName,
              lastName: user[0].lastName || "",
              avatar: user[0].avatar || "",
            },
            "Google Sign up successful"
          )
        );
    }
  } catch (err) {
    // Rollback transaction on error
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    next(err);
  }
};

// Handles user logout by removing refreshtoken from device session, clearing auth cookies, and sending a success response
export const signout = asyncHandler(async (req: Request, res: Response) => {
  // Get user ID from request which is set by authentication middleware
  const userId = req.user?._id;

  // Find and revoke device session for the user
  await DeviceSession.findOneAndUpdate(
    {
      userId,
      deviceId: req.cookies.deviceId,
    },
    {
      $unset: {
        refreshToken: 1,
        previousRefreshToken: 1,
        previousTokenExpiresAt: 1,
      },
      $set: { lastActiveAt: new Date() },
    },
    { lean: true }
  );

  // Clear auth cookies
  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "Logout successful"));
});

// Handles password reset for unauthenticated users. Verifies email, validates new password, updates it, and sends a success email.
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const validatedData = forgotPasswordSchema.parse(req.body);

    const { email, password } = validatedData;

    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Update password (pre-save hook will handle hashing)
    user.password = password;
    await user.save();

    const userAgentRaw = req.header("user-agent") || "";
    const ipAddressRaw = requestIp.getClientIp(req) || "";
    const deviceInfo = parseDeviceInfo(userAgentRaw, ipAddressRaw);
    await SecurityEvent.create({
      userId: user._id,
      eventType: "password_change",
      ipAddress: ipAddressRaw || "Unknown IP",
      userAgent: userAgentRaw || "Unknown User Agent",
      isEmailSent: true,
      metadata: {
        deviceInfo,
      },
    });

    // Send success email (non-blocking)
    sendEmail(email, passwordUpdateSuccess({ USER_NAME: user.firstName }));

    res
      .status(200)
      .json(new ApiResponse(200, null, "Password reset successful"));
  }
);
