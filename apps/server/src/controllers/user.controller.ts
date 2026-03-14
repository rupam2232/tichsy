import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { DeviceSession } from "../models/deviceSession.model.js";
import { Otp } from "../models/otp.model.js";
import { SecurityEvent } from "../models/securityEvent.model.js";
import {
  updateProfileSchema,
  verifyCurrentEmailSchema,
  changeEmailSchema,
  changePasswordSchema,
} from "@repo/types";
import requestIp from "request-ip";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail.js";
import {
  emailResetSuccessTemplate,
  passwordResetSuccessTemplate,
} from "../templates/emailTemplates.js";
import { generateActionToken } from "../utils/jwt.js";
import cloudinary from "../utils/cloudinary.js";
import { env } from "../env.js";

export const getCurrentUser = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const validatedData = updateProfileSchema.parse(req.body);
  const updatePayload = { ...validatedData };

  if (req.file) {
    if (req.user!.avatar && req.user!.avatar.includes("cloudinary.com")) {
      await cloudinary.delete(req.user!.avatar);
    }
    const uploadResponse = await cloudinary.upload(req.file.path, "avatars");
    if (!uploadResponse) {
      throw new ApiError(500, "Failed to upload avatar to Cloudinary");
    }
    updatePayload.avatar = uploadResponse.secure_url;
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user!._id,
    {
      $set: updatePayload,
    },
    { new: true }
  ).select("-password -__v");

  res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
});

export const verifyCurrentEmail = asyncHandler(async (req, res) => {
  const { otp } = verifyCurrentEmailSchema.parse(req.body);
  const currentEmail = req.user!.email;

  const otpRecord = await Otp.findOne({
    email: currentEmail,
    context: "verify-current-email", // or a specific verify context
  });

  if (!otpRecord) {
    throw new ApiError(404, "Otp not found");
  }

  if (otpRecord.expiresAt < new Date()) {
    throw new ApiError(400, "Otp is expired");
  }

  const isOtpValid = await otpRecord.isOtpCorrect(otp);
  if (!isOtpValid) {
    throw new ApiError(400, "Otp is incorrect");
  }

  const actionToken = generateActionToken({
    userId: req.user!._id.toString(),
    action: "change-email",
    currentEmail: req.user!.email,
  });

  await Otp.deleteOne({ _id: otpRecord._id });

  res
    .status(200)
    .json(new ApiResponse(200, { actionToken }, "Current email verified"));
});

export const verifyEmailChange = asyncHandler(async (req, res) => {
  const { newEmail, otp } = changeEmailSchema.parse(req.body);
  const { actionToken } = req.body;

  if (newEmail === req.user!.email) {
    throw new ApiError(400, "New email is same as current email");
  }

  if (!actionToken)
    throw new ApiError(
      403,
      "Action token is missing. Please verify your current email first"
    );

  // Verify the action token
  try {
    const decoded = jwt.verify(actionToken, env.JWT_SECRET_KEY) as {
      userId: string;
      action: string;
      currentEmail: string;
    };
    if (
      decoded.action !== "change-email" ||
      decoded.userId !== req.user!._id.toString() ||
      decoded.currentEmail !== req.user!.email
    ) {
      throw new ApiError(403, "Invalid or unauthorized action token");
    }
  } catch {
    throw new ApiError(
      403,
      "Action token has expired or is invalid. Please restart the process"
    );
  }

  const otpRecord = await Otp.findOne({
    email: newEmail,
    context: "change-email",
  });

  if (!otpRecord) {
    throw new ApiError(404, "Otp not found");
  }

  if (otpRecord.expiresAt < new Date()) {
    throw new ApiError(400, "Otp is expired");
  }

  const isOtpValid = await otpRecord.isOtpCorrect(otp);
  if (!isOtpValid) {
    throw new ApiError(400, "Otp is incorrect");
  }

  const existingUser = await User.findOne({ email: newEmail });
  if (existingUser) throw new ApiError(400, "Email already in use");

  // Success logic
  const updatedUser = await User.findByIdAndUpdate(
    req.user!._id,
    { $set: { email: newEmail } },
    { new: true }
  ).select("-password -__v");

  if (!updatedUser) throw new ApiError(404, "User not found");

  await Otp.deleteOne({ _id: otpRecord._id });

  sendEmail(
    newEmail,
    "email-change-success",
    emailResetSuccessTemplate(updatedUser.firstName ?? "User", newEmail)
  );
  sendEmail(
    req.user!.email,
    "email-change-success",
    emailResetSuccessTemplate(updatedUser.firstName ?? "User", newEmail)
  );

  await SecurityEvent.create({
    userId: req.user!._id,
    eventType: "email_change",
    ipAddress: requestIp.getClientIp(req) || "Unknown IP",
    userAgent: req.header("user-agent") || "Unknown User Agent",
    isEmailSent: true,
    metadata: {
      oldEmail: req.user!.email,
      newEmail: newEmail,
    },
  });

  res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Email updated successfully"));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, otp } = changePasswordSchema.parse(
    req.body
  );

  const user = await User.findById(req.user!._id);
  if (!user) throw new ApiError(404, "User not found");

  // Verify Current Password
  const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Current password is incorrect");
  }

  const otpRecord = await Otp.findOne({
    email: user.email,
    context: "change-password",
  });

  if (!otpRecord) {
    throw new ApiError(404, "Otp not found");
  }

  if (otpRecord.expiresAt < new Date()) {
    throw new ApiError(400, "Otp is expired");
  }

  const isOtpValid = await otpRecord.isOtpCorrect(otp);
  if (!isOtpValid) {
    throw new ApiError(400, "Otp is incorrect");
  }

  user.password = newPassword;
  await user.save(); // pre-save hook will hash it

  await Otp.deleteOne({ _id: otpRecord._id });

  sendEmail(
    user.email,
    "password-reset-success",
    passwordResetSuccessTemplate(user.firstName ?? "User")
  );

  await SecurityEvent.create({
    userId: user._id,
    eventType: "password_change",
    ipAddress: requestIp.getClientIp(req) || "Unknown IP",
    userAgent: req.header("user-agent") || "Unknown User Agent",
    isEmailSent: true,
  });

  res
    .status(200)
    .json(new ApiResponse(200, null, "Password updated successfully"));
});

export const getSessions = asyncHandler(async (req, res) => {
  const sessions = await DeviceSession.find({
    userId: req.user!._id,
    revoked: false,
  })
    .sort({ lastActiveAt: -1 })
    .limit(20);

  const currentSession = sessions.find(
    (session) =>
      session.refreshToken === req.cookies.refreshToken ||
      session.previousRefreshToken === req.cookies.refreshToken
  );

  if (currentSession) {
    sessions.splice(sessions.indexOf(currentSession), 1);
    sessions.unshift(currentSession);
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { sessions, currentSession },
        "Sessions fetched successfully"
      )
    );
});

export const revokeSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await DeviceSession.findOne({
    _id: sessionId,
    userId: req.user!._id,
  });

  if (!session) throw new ApiError(404, "Session not found");

  session.revoked = true;
  await session.save();

  res
    .status(200)
    .json(new ApiResponse(200, null, "Session revoked successfully"));
});

export const getSecurityEvents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const totalEvents = await SecurityEvent.countDocuments({
    userId: req.user!._id,
  });

  const events = await SecurityEvent.find({
    userId: req.user!._id,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        events,
        page,
        limit,
        totalEvents,
        totalPages: Math.ceil(totalEvents / limit),
      },
      "Security events fetched successfully"
    )
  );
});
