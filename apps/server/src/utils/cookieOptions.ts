import { env } from "../env.js";
import { CookieOptions } from "express";

export const getCookieOptions = (): CookieOptions => {
  const isProd = env.NODE_ENV === "production";
  const cookieDomain = env.COOKIE_DOMAIN;
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? ("lax" as const) : ("strict" as const),
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  };
};
