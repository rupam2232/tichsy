import { env } from "../env.js";

export const getCookieOptions = () => {
  const isProd = env.NODE_ENV === "production";
  const cookieDomain = env.COOKIE_DOMAIN;
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? ("none" as const) : ("strict" as const),
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  };
};
