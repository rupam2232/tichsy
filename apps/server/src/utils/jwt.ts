import jwt from "jsonwebtoken";
import { env } from "../env.js";

export interface accessTokenUser {
  _id: string;
  email: string;
  firstName?: string;
  [key: string]: any;
}

export const generateAccessToken = (user: accessTokenUser) => {
  const secret = env.ACCESS_TOKEN_SECRET;
  const expiresIn = env.ACCESS_TOKEN_EXPIRY;

  return jwt.sign(user, secret as jwt.Secret, {
    expiresIn: `${Number(expiresIn)}d`,
  });
};

export const generateRefreshToken = (userId: accessTokenUser["_id"]) => {
  const secret = env.REFRESH_TOKEN_SECRET;
  const expiresIn = env.REFRESH_TOKEN_EXPIRY;

  return jwt.sign({ _id: userId }, secret as jwt.Secret, {
    expiresIn: `${Number(expiresIn)}d`,
  });
};

export const generateActionToken = (data: Record<string, any>) => {
  return jwt.sign(data, env.JWT_SECRET_KEY!, {
    expiresIn: "15m",
  });
};