import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Types } from "mongoose";
import { Invitation } from "../models/invitation.model.js";
import { Restaurant } from "../models/restaurant.model.js";
import { RestaurantMember } from "../models/restaurantMember.model.js";
import { User } from "../models/user.model.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import { sendInviteSchema } from "@repo/types";
import { env } from "../env.js";
import { inviteStaff } from "../templates/emailTemplates.js";
import { checkStaffLimit } from "../service/subscription.service.js";
import { createNotification } from "../service/notification.service.js";

export const sendInvitation = asyncHandler(async (req, res) => {
  if (req.restaurantRole !== "owner") {
    throw new ApiError(403, "Only the owner can send invitations");
  }

  // Use local zod parse
  const { email, role } = sendInviteSchema.parse(req.body);
  const restaurant = req.restaurant!;

  // Check if user is already a staff member
  const existingUser = await User.exists({
    email: email.toLowerCase(),
  });
  if (existingUser) {
    // Check if user is already a member via RestaurantMember collection
    const existingMembership = await RestaurantMember.exists({
      userId: existingUser._id,
      restaurantId: restaurant._id,
    });
    if (existingMembership) {
      throw new ApiError(
        400,
        "User is already a staff member in this restaurant"
      );
    }
    if (restaurant.ownerId.toString() === existingUser._id.toString()) {
      throw new ApiError(400, "User is the owner of this restaurant");
    }
  }

  // Check for existing pending invitation
  const existingInvite = await Invitation.findOne({
    email: email.toLowerCase(),
    restaurantId: restaurant._id,
    status: "pending",
  });

  if (existingInvite) {
    if (existingInvite.expiresAt > new Date()) {
      throw new ApiError(
        400,
        "A pending invitation already exists for this email"
      );
    } else {
      // Mark as expired if it's passed its time
      existingInvite.status = "expired";
      await existingInvite.save();
    }
  }

  // Enforce staff limits from subscription plan (this counts active staff + pending invites)
  await checkStaffLimit(restaurant, restaurant.ownerId);

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  const invitation = await Invitation.create({
    email,
    restaurantId: restaurant._id,
    role,
    token,
    status: "pending",
    invitedBy: req.user!._id,
    expiresAt,
  });

  // Construct invite link
  const frontendUrl = env.FRONTEND_URL;
  const inviteLink = `${frontendUrl}/join?token=${token}`;

  // Send email
  try {
    const template = inviteStaff({
      RESTAURANT_NAME: restaurant.restaurantName,
      ROLE: invitation.role,
      INVITATION_LINK: inviteLink,
      EXPIRY_DATE: "7 days",
      INVITER_NAME: req.user!.firstName + " " + (req.user!.lastName ?? ""),
    });

    await sendEmail(email, template);
  } catch (error) {
    console.error("Failed to send invitation email", error);
  }

  res
    .status(201)
    .json(new ApiResponse(201, invitation, "Invitation sent successfully"));
});

export const getInvitations = asyncHandler(async (req, res) => {
  if (req.restaurantRole !== "owner") {
    throw new ApiError(403, "Only the owner can view invitations");
  }

  const restaurant = req.restaurant!;
  const invitations = await Invitation.find({ restaurantId: restaurant._id })
    .populate("invitedBy", "firstName lastName email")
    .sort({ createdAt: -1 })
    .lean();

  res
    .status(200)
    .json(
      new ApiResponse(200, invitations, "Invitations fetched successfully")
    );
});

export const revokeInvitation = asyncHandler(async (req, res) => {
  if (req.restaurantRole !== "owner") {
    throw new ApiError(403, "Only the owner can revoke invitations");
  }

  const { id } = req.params;
  const invitation = await Invitation.findOne({
    _id: id,
    restaurantId: req.restaurant!._id,
  });

  if (!invitation) {
    throw new ApiError(404, "Invitation not found");
  }

  if (invitation.status !== "pending") {
    throw new ApiError(
      400,
      `Cannot revoke invitation with status ${invitation.status}`
    );
  }

  await invitation.deleteOne();

  res
    .status(200)
    .json(new ApiResponse(200, null, "Invitation revoked successfully"));
});

export const verifyInvitation = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const invitation = await Invitation.findOne({ token }).populate(
    "restaurantId",
    "_id restaurantName logoUrl"
  );

  if (!invitation) {
    throw new ApiError(404, "Invitation not found or invalid");
  }

  if (invitation.status !== "pending") {
    throw new ApiError(400, `Invitation is ${invitation.status}`);
  }

  if (invitation.expiresAt < new Date()) {
    invitation.status = "expired";
    await invitation.save();
    throw new ApiError(400, "Invitation has expired");
  }

  res.status(200).json(new ApiResponse(200, invitation, "Invitation is valid"));
});

export const acceptInvitation = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const user = req.user!;

  const invitation = await Invitation.findOne({ token, status: "pending" });

  if (!invitation) {
    throw new ApiError(404, "Invitation not found or no longer pending");
  }

  if (invitation.expiresAt < new Date()) {
    invitation.status = "expired";
    await invitation.save();
    throw new ApiError(400, "Invitation has expired");
  }

  if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    throw new ApiError(
      403,
      "This invitation was sent to a different email address"
    );
  }

  const restaurant = await Restaurant.findById(invitation.restaurantId);
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  // We pass true here because the user hitting this endpoint is the invitee, not the owner
  await checkStaffLimit(restaurant, restaurant.ownerId, true);

  // Check if already a member using RestaurantMember collection
  const existingMembership = await RestaurantMember.findOne({
    userId: user._id,
    restaurantId: restaurant._id,
  });

  if (!existingMembership) {
    // Create new RestaurantMember document
    await RestaurantMember.create({
      userId: user._id,
      restaurantId: restaurant._id,
      role: invitation.role as "manager" | "staff",
      joinedAt: new Date(),
    });
  } else if (existingMembership.isArchived) {
    // If archived, unarchive them with the new role
    existingMembership.isArchived = false;
    existingMembership.archivedAt = undefined;
    existingMembership.archivedReason = undefined;
    existingMembership.role = invitation.role as "manager" | "staff";
    await existingMembership.save();
  }

  invitation.status = "accepted";
  await invitation.save();

  if (
    user.restaurantIds &&
    !user.restaurantIds.includes(restaurant._id as Types.ObjectId)
  ) {
    user.restaurantIds.push(restaurant._id as Types.ObjectId);
    await user.save();
  }

  createNotification({
    recipient: restaurant.ownerId,
    type: "system",
    title: "Invitation Accepted",
    message: `${user.firstName} ${user.lastName} has accepted your invitation to join ${restaurant.restaurantName}`,
    data: {
      restaurantId: restaurant._id,
      restaurantName: restaurant.restaurantName,
      imageUrl: restaurant.logoUrl,
      restaurantSlug: restaurant.slug,
    },
  });

  res
    .status(200)
    .json(new ApiResponse(200, null, "Invitation accepted successfully"));
});

export const rejectInvitation = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const user = req.user!;

  const invitation = await Invitation.findOne({ token, status: "pending" });

  if (!invitation) {
    throw new ApiError(404, "Invitation not found or no longer pending");
  }

  if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    throw new ApiError(
      403,
      "This invitation was sent to a different email address"
    );
  }

  invitation.status = "rejected";
  await invitation.save();

  res.status(200).json(new ApiResponse(200, null, "Invitation rejected"));
});
