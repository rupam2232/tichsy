import { Otp } from "../models/otp.model.js";
import generateOtp from "../utils/generateOtp.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import sendEmail from "../utils/sendEmail.js";
import {
  passwordResetRequestTemplate,
  verificationEmailTemplate,
} from "../utils/emailTemplates.js";
import { User } from "../models/user.model.js";

export const sendOtp = asyncHandler(async (req, res) => {
  if (!req.body || !req.body.email || !req.body.context) {
    throw new ApiError(400, "Email and context are required");
  }
  const { email, name, context } = req.body;

  if (
    context !== "signup" &&
    context !== "change-password" &&
    context !== "forgot-password"
  ) {
    throw new ApiError(400, "Invalid context");
  }

  const user = await User.findOne({ email });

  if (context === "forgot-password" || context === "change-password") {
    if (!user) {
      throw new ApiError(404, "User not found with this email");
    }
  } else if (context === "signup") {
    if (user) {
      throw new ApiError(400, "User already exists with this email");
    }
  }

  const otp = generateOtp();
  const expires = new Date(Date.now() + 600000); // 10 minutes

  let otpDoc = await Otp.findOne({ email });
  if (!otpDoc) {
    otpDoc = new Otp({ email, otp, context, expires });
  } else {
    otpDoc.otp = otp;
    otpDoc.expiresAt = expires;
    otpDoc.context = context;
  }

  await otpDoc.save();

  if (!otpDoc) {
    throw new ApiError(500, "Otp not created");
  }

  if (context === "signup") {
    const emailResponse = await sendEmail(
      email,
      context,
      verificationEmailTemplate(name, otp, 10)
    );

    if (!emailResponse || emailResponse.success === false) {
      throw new ApiError(500, "Failed to send Otp");
    }

    res.status(200).json(new ApiResponse(200, true, "Otp sent successfully"));
  } else if (context === "change-password" || context === "forgot-password") {
    const emailResponse = await sendEmail(
      email,
      context,
      passwordResetRequestTemplate(name ?? user?.firstName ?? "User", otp, 10)
    );

    if (!emailResponse || emailResponse.success === false) {
      throw new ApiError(500, "Failed to send Otp");
    }

    res.status(200).json(new ApiResponse(200, true, "Otp sent successfully"));
  } else {
    throw new ApiError(400, "Invalid template");
  }
});

export const verifyOtp = asyncHandler(async (req, res) => {
  if (!req.body || !req.body.email || !req.body.otp || !req.body.context) {
    throw new ApiError(400, "Email, Otp and context are required");
  }
  const { email, otp, context } = req.body;

  const otpData = await Otp.findOne({ email });

  if (!otpData) {
    throw new ApiError(404, "Otp not found");
  }

  if (otpData.expiresAt < new Date()) {
    throw new ApiError(400, "Otp is expired");
  }

  if (otpData.context !== context) {
    throw new ApiError(400, "Invalid Otp");
  }

  const isOtpCorrect = await otpData.isOtpCorrect(otp);

  if (!isOtpCorrect) {
    throw new ApiError(400, "Otp is incorrect");
  }

  await otpData.deleteOne();

  res.status(200).json(new ApiResponse(200, true, "Otp verified successfully"));
});
