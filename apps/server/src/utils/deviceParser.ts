import { UAParser } from "ua-parser-js";
import geoip from "geoip-lite";

export interface DeviceInfo {
  browser: string;
  os: string;
  type: "desktop" | "mobile" | "tablet" | "app";
  location: string;
  timezone: string;
}

/**
 * Parses raw User-Agent and IP strings into a human-readable DeviceInfo object.
 * Handles edge cases like localhost development, Postman testing, and unidentified devices.
 *
 * @param userAgent The raw `req.headers["user-agent"]` string.
 * @param ipAddress The raw `requestIp.getClientIp(req)` string.
 * @returns A structured `DeviceInfo` object guaranteed to have non-null fallbacks.
 */
export const parseDeviceInfo = (
  userAgent: string = "",
  ipAddress: string = ""
): DeviceInfo => {
  // 1. Handle Localhost IP Edge Cases
  const isLocalhost =
    ipAddress === "::1" ||
    ipAddress === "127.0.0.1" ||
    ipAddress === "::ffff:127.0.0.1";

  // 2. Parse GeoLocation
  let location = "Unknown Location";
  let timezone = "Asia/Kolkata"; // Default fallback
  if (isLocalhost) {
    location = "Local Development";
  } else {
    const geo = geoip.lookup(ipAddress);
    if (geo) {
      location = `${geo.city || "Unknown City"}, ${geo.country || "Unknown Country"}`;
      timezone = geo.timezone || "Asia/Kolkata";
    }
  }

  // 3. Parse User-Agent
  const parser = new UAParser(userAgent);
  const browserRaw = parser.getBrowser();
  const osRaw = parser.getOS();
  const deviceRaw = parser.getDevice();

  let browser = browserRaw.name || "Unknown Browser";
  let os = osRaw.name || "Unknown OS";
  let type: DeviceInfo["type"] = "desktop"; // Default fallback

  // 4. Handle Postman/Insomnia/App Edge Cases
  const uaLower = userAgent.toLowerCase();

  if (uaLower.includes("postman") || uaLower.includes("insomnia")) {
    browser = "API Tester";
    os = "Development tool";
    type = "app";
  } else if (
    uaLower.includes("dart") ||
    uaLower.includes("okhttp") ||
    uaLower.includes("cfnetwork")
  ) {
    // If future mobile app requests hit the server from native HTTP clients
    type = "app";
  } else {
    // Determine type based on UAParser detection
    const parsedType = deviceRaw.type;
    if (parsedType === "mobile") type = "mobile";
    else if (parsedType === "tablet") type = "tablet";
    // SmartTVs/Consoles default back to desktop for simplistic UI icons
    else type = "desktop";
  }

  return {
    browser,
    os,
    type,
    location,
    timezone,
  };
};
