import { User } from "../models/user.model.js";
import { SecurityEvent } from "../models/securityEvent.model.js";
import { DeviceSession } from "../models/deviceSession.model.js";
import { NextFunction, Request, Response } from "express";
import { ClientSession, startSession } from "mongoose";
import requestIp from "request-ip";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import { Subscription } from "../models/subscription.model.js";
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
import { DeviceInfo, parseDeviceInfo } from "../utils/deviceParser.js";

const options = getCookieOptions();
const googleOAuth2Client = new OAuth2Client(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  "postmessage"
);

// --- HELPER FUNCTIONS ---

const processSignupWorkflow = async (
  user: User,
  deviceId: string,
  ipAddressRaw: string,
  userAgentRaw: string,
  deviceInfo: DeviceInfo,
  session: ClientSession
) => {
  const refreshToken = generateRefreshToken(user._id.toString());
  const accessToken = generateAccessToken({
    _id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
  });

  await Subscription.create(
    [{ userId: user._id, plan: "starter", isSubscriptionActive: true }],
    { session }
  );
  await DeviceSession.create(
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
  );
  await SecurityEvent.create(
    [
      {
        userId: user._id,
        eventType: "signup",
        ipAddress: ipAddressRaw || "Unknown IP",
        userAgent: userAgentRaw || "Unknown User Agent",
        metadata: { deviceInfo },
        isEmailSent: true,
      },
    ],
    { session }
  );

  return { accessToken, refreshToken };
};

const processSigninWorkflow = async (
  user: User,
  deviceId: string,
  ipAddressRaw: string,
  userAgentRaw: string,
  deviceInfo: DeviceInfo,
  session: ClientSession
) => {
  const refreshToken = generateRefreshToken(user._id.toString());
  const accessToken = generateAccessToken({
    _id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
  });

  const deviceSession = await DeviceSession.findOne({
    userId: user._id,
    deviceId,
  }).session(session);
  let isNewDevice = false;

  if (deviceSession) {
    deviceSession.revoked = false;
    deviceSession.refreshToken = refreshToken;
    deviceSession.previousRefreshToken = undefined;
    deviceSession.previousTokenExpiresAt = undefined;
    deviceSession.lastActiveAt = new Date();
    await deviceSession.save();
  } else {
    isNewDevice = true;
    await DeviceSession.create(
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
    );
    await SecurityEvent.create(
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
    );
  }

  return { accessToken, refreshToken, isNewDevice };
};

const dispatchSignupNotifications = (user: User) => {
  sendEmail(user.email, welcome({ USER_NAME: user.firstName }));
  createNotification({
    recipient: user._id,
    type: "system",
    title: "Welcome to Tichsy",
    message:
      "Your account has been successfully created. We're glad to have you. Explore the features and enjoy the platform",
  });
};

const dispatchNewDeviceLoginNotifications = (
  user: User,
  deviceInfo: DeviceInfo
) => {
  sendEmail(
    user.email,
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
};

const sendAuthResponse = (
  res: Response,
  statusCode: number,
  user: User,
  accessToken: string,
  refreshToken: string,
  deviceId: string,
  message: string
) => {
  res
    .status(statusCode)
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
        statusCode,
        {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName || "",
          avatar: user.avatar || "",
        },
        message
      )
    );
};

// --- CONTROLLERS ---

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.body) throw new ApiError(400, "Request body is required");

  const session = await startSession();
  try {
    session.startTransaction();
    const validatedData = signUpSchema.parse(req.body);
    const { email, password, fullName, timezone: bodyTimezone } = validatedData;
    const deviceId = req.cookies.deviceId || crypto.randomUUID();

    const isUserExists = await User.findOne({ email }).session(session);

    if (isUserExists) {
      throw new ApiError(400, "User already exists");
    }

    const [firstName, ...lastNameParts] = fullName.split(" ");
    const lastName = lastNameParts.join(" ");

    const userAgentRaw = req.header("user-agent") || "";
    const ipAddressRaw = requestIp.getClientIp(req) || "";
    const deviceInfo = parseDeviceInfo(userAgentRaw, ipAddressRaw);

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
      { session }
    );

    const { accessToken, refreshToken } = await processSignupWorkflow(
      user[0],
      deviceId,
      ipAddressRaw,
      userAgentRaw,
      deviceInfo,
      session
    );

    await session.commitTransaction();
    session.endSession();

    dispatchSignupNotifications(user[0]);

    sendAuthResponse(
      res,
      201,
      user[0],
      accessToken,
      refreshToken,
      deviceId,
      "Sign up successful"
    );
  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

export const signin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const session = await startSession();
  try {
    session.startTransaction();
    const validatedData = signInSchema.parse(req.body);
    const { email, password } = validatedData;
    const deviceId = req.cookies.deviceId || crypto.randomUUID();

    const userAgentRaw = req.header("user-agent") || "";
    const ipAddressRaw = requestIp.getClientIp(req) || "";
    const deviceInfo = parseDeviceInfo(userAgentRaw, ipAddressRaw);

    const user = await User.findOne({ email }).session(session);

    if (!user || !(await user.isPasswordCorrect(password))) {
      throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken, isNewDevice } =
      await processSigninWorkflow(
        user,
        deviceId,
        ipAddressRaw,
        userAgentRaw,
        deviceInfo,
        session
      );

    await session.commitTransaction();
    session.endSession();

    if (isNewDevice) {
      dispatchNewDeviceLoginNotifications(user, deviceInfo);
    }

    sendAuthResponse(
      res,
      200,
      user,
      accessToken,
      refreshToken,
      deviceId,
      "Sign in successful"
    );
  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

export const google = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const session = await startSession();
  try {
    session.startTransaction();
    const deviceId = req.cookies.deviceId || crypto.randomUUID();
    if (!req.body || (!req.body.code && !req.body.credential))
      throw new ApiError(
        400,
        "Please provide a Google authorization code or credential to continue"
      );

    if (req.body.code && req.body.credential)
      throw new ApiError(
        400,
        "Please provide either a Google authorization code or credential to continue"
      );

    const { code, credential } = req.body;

    let tokens;
    if (code) {
      tokens = (await googleOAuth2Client.getToken(code)).tokens;
      if (!tokens.id_token) throw new ApiError(400, "Invalid Google ID token");
    }

    const ticket = await googleOAuth2Client.verifyIdToken({
      idToken: tokens?.id_token ?? credential,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email)
      throw new ApiError(400, "Invalid Google ID token");

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

    if (!email_verified)
      throw new ApiError(400, "Email not verified by Google");

    const existingUser = await User.findOne({ email }).session(session);

    if (existingUser) {
      existingUser.firstName =
        existingUser.firstName ?? (given_name || name?.split(" ")[0] || "");
      existingUser.lastName =
        existingUser.lastName ?? (family_name || name?.split(" ")[1] || "");
      existingUser.avatar = existingUser.avatar ?? (picture || undefined);
      existingUser.oauthId = googleId;
      existingUser.oauthProvider = "google";
      await existingUser.save({ session });

      const { accessToken, refreshToken, isNewDevice } =
        await processSigninWorkflow(
          existingUser,
          deviceId,
          ipAddressRaw,
          userAgentRaw,
          deviceInfo,
          session
        );

      await session.commitTransaction();
      session.endSession();

      if (isNewDevice) {
        dispatchNewDeviceLoginNotifications(existingUser, deviceInfo);
      }

      sendAuthResponse(
        res,
        200,
        existingUser,
        accessToken,
        refreshToken,
        deviceId,
        "Google Sign in successful"
      );
    } else {
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

      const { accessToken, refreshToken } = await processSignupWorkflow(
        user[0],
        deviceId,
        ipAddressRaw,
        userAgentRaw,
        deviceInfo,
        session
      );

      await session.commitTransaction();
      session.endSession();

      dispatchSignupNotifications(user[0]);

      sendAuthResponse(
        res,
        201,
        user[0],
        accessToken,
        refreshToken,
        deviceId,
        "Google Sign up successful"
      );
    }
  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    next(err);
  }
};

export const signout = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;

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

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "Logout successful"));
});

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const validatedData = forgotPasswordSchema.parse(req.body);

    const { email, password } = validatedData;

    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

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
      metadata: { deviceInfo },
    });

    sendEmail(email, passwordUpdateSuccess({ USER_NAME: user.firstName }));

    res
      .status(200)
      .json(new ApiResponse(200, null, "Password reset successful"));
  }
);
