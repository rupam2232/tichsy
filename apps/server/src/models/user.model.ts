// Defines the User schema and model for MongoDB using Mongoose
import { Schema, model, Document, Types } from "mongoose";
import bcrypt from "bcrypt";

/**
 * TypeScript interface for a User document.
 * Includes both traditional and OAuth fields.
 */
export interface User extends Document {
  _id: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  email: string;
  password?: string;
  avatar?: string;
  restaurantIds?: Types.ObjectId[];
  oauthProvider?: string;
  oauthId?: string;
  isArchived?: boolean; // Whether the user (staff) is archived
  archivedAt?: Date; // When the user was archived
  archivedReason?: string; // Reason for archiving
  isPasswordCorrect(password: string): Promise<boolean>;
  createdAt: Date; // Timestamp when the document was first created (set automatically, never changes)
  updatedAt?: Date; // Timestamp when the document was last updated (set automatically, updates on modification)
}

/**
 * Mongoose schema for the User collection.
 */
const userSchema: Schema<User> = new Schema(
  {
    firstName: String,
    lastName: String,
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      unique: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please use a valid email address",
      ],
      lowercase: true,
    },
    password: {
      type: String,
      required() {
        return !this.oauthProvider;
      },
    },
    avatar: String,
    restaurantIds: {
      type: [Schema.Types.ObjectId],
      ref: "Restaurant",
      default: [],
    },
    oauthProvider: {
      type: String,
      immutable(doc) {
        return !!doc.oauthProvider;
      },
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: Date,
    archivedReason: String,
    oauthId: {
      type: String,
      unique: true,
      sparse: true,
      required() {
        return !!this.oauthProvider;
      },
      immutable(doc) {
        return !!doc.oauthProvider;
      },
    },
    createdAt: {
      type: Date,
      immutable: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save hook to hash the password before saving the user document.
 */
userSchema.pre<User>("save", async function (next) {
  if (!this || !this.isModified || !this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password as string, 10);
});

/**
 * Instance method to compare a plain password with the hashed password.
 */
userSchema.methods.isPasswordCorrect = async function (
  password: User["password"]
): Promise<boolean> {
  if (!this.password || !password) {
    return false;
  } else {
    return await bcrypt.compare(password, this.password);
  }
};

/**
 * Mongoose model for the User schema.
 */
export const User = model<User>("User", userSchema);
