import { Otp } from "../models/otp.model.js";
import generateOtp from "../utils/generateOtp.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import sendEmail from "../utils/sendEmail.js";
import {
  passwordUpdateRequest,
  signupEmailVerify,
  verifyCurrentEmail,
  verifyNewEmail,
} from "../templates/emailTemplates.js";
import { User } from "../models/user.model.js";
import { sendOtpSchema, verifyOtpSchema } from "@repo/types";

export const sendOtp = asyncHandler(async (req, res) => {
  const validatedData = sendOtpSchema.parse(req.body);
  const { email, name, context } = validatedData;

  const user = await User.findOne({ email }).lean();

  if (context === "forgot-password") {
    if (!user) {
      throw new ApiError(404, "User not found with this email");
    }
  } else if (context === "signup") {
    if (user) {
      throw new ApiError(400, "Email already in use");
    }
  } else if (context === "change-email") {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    } else if (user) {
      throw new ApiError(400, "Email already in use");
    }
  } else if (
    context === "verify-current-email" ||
    context === "change-password"
  ) {
    if (!user) {
      throw new ApiError(404, "User not found with this email");
    } else {
      if (!req.user || req.user.email !== user.email) {
        throw new ApiError(
          401,
          req.user
            ? "Email already in use"
            : "You are not authorized to perform this action"
        );
      }
    }
  }

  const otp = generateOtp(6);
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
      signupEmailVerify({
        USER_NAME: name,
        OTP_CODE: otp,
        OTP_EXPIRY: "10 minutes",
      })
    );

    if (!emailResponse || emailResponse.success === false) {
      throw new ApiError(500, "Failed to send Otp");
    }
  } else if (context === "change-email") {
    const emailResponse = await sendEmail(
      email,
      verifyNewEmail({
        USER_NAME: name ?? user?.firstName,
        OTP_CODE: otp,
        OTP_EXPIRY: "10 minutes",
      })
    );

    if (!emailResponse || emailResponse.success === false) {
      throw new ApiError(500, "Failed to send Otp");
    }
  } else if (context === "change-password" || context === "forgot-password") {
    const emailResponse = await sendEmail(
      email,
      passwordUpdateRequest({
        USER_NAME: name ?? user?.firstName,
        OTP_CODE: otp,
        OTP_EXPIRY: "10 minutes",
      })
    );

    if (!emailResponse || emailResponse.success === false) {
      throw new ApiError(500, "Failed to send Otp");
    }
  } else if (context === "verify-current-email") {
    const emailResponse = await sendEmail(
      email,
      verifyCurrentEmail({
        USER_NAME: name ?? user?.firstName,
        OTP_CODE: otp,
        OTP_EXPIRY: "10 minutes",
      })
    );

    if (!emailResponse || emailResponse.success === false) {
      throw new ApiError(500, "Failed to send Otp");
    }
  } else {
    throw new ApiError(400, "Invalid template");
  }

  res.status(200).json(new ApiResponse(200, true, "Otp sent successfully"));
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const validatedData = verifyOtpSchema.parse(req.body);
  const { email, otp, context } = validatedData;

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
