export const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production";
  const cookieDomain = process.env.COOKIE_DOMAIN;
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" as const : "strict" as const,
    ...(cookieDomain ? { domain: cookieDomain } : {})
  };
};