import { addDays, set, isAfter, startOfDay, differenceInCalendarDays } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

const DEFAULT_TIMEZONE = "Asia/Kolkata";

/**
 * Calculates how many calendar days until the subscription ends.
 * Uses the provided timezone for accurate calendar day comparison.
 *
 * @param subscriptionEndDate - The subscription end date (stored in UTC).
 * @param timeZone - User's timezone for calendar day calculation.
 * @returns Number of days until expiry (3 = expires in 3 days, 0 = expires today, -1 = expired yesterday).
 */
export const getDaysUntilExpiry = (
  subscriptionEndDate: Date,
  timeZone: string = DEFAULT_TIMEZONE
): number => {
  const now = new Date();
  const nowInTz = toZonedTime(now, timeZone);
  const endDateInTz = toZonedTime(subscriptionEndDate, timeZone);

  // Compare calendar days (ignoring time)
  const todayStart = startOfDay(nowInTz);
  const endDayStart = startOfDay(endDateInTz);

  return differenceInCalendarDays(endDayStart, todayStart);
};

/**
 * Calculates a subscription or trial expiry date.
 * The time is set to 23:59:00.000 in the given timezone,
 * and then converted back to UTC for database storage.
 *
 * @param daysToAdd - Number of days to add to the current date.
 * @param timeZone - Timezone to use for calculation. Default is Asia/Kolkata (IST).
 * @returns The calculated Date object in UTC.
 */
export const calculateSubscriptionExpiryDate = (
  daysToAdd: number,
  timeZone: string = "Asia/Kolkata"
): Date => {
  const nowInServerTime = new Date();
  const nowInTimeZone = toZonedTime(nowInServerTime, timeZone);
  const endDateInTimeZone = addDays(nowInTimeZone, daysToAdd);

  // Set to end of the day in the given timezone
  const endOfDayInTimeZone = set(endDateInTimeZone, {
    hours: 23,
    minutes: 59,
    seconds: 0,
    milliseconds: 0,
  });

  // Return converted back to UTC
  return fromZonedTime(endOfDayInTimeZone, timeZone);
};

/**
 * Calculates subscription expiry by extending from a base date.
 * Used for renewals where days are added to the existing end date.
 * If the base date is in the past, uses current date instead.
 *
 * @param baseDate - The date to extend from (usually current subscription end date).
 * @param daysToAdd - Number of days to add.
 * @param timeZone - Timezone to use for calculation. Default is Asia/Kolkata (IST).
 * @returns The calculated Date object in UTC.
 */
export const extendSubscriptionExpiryDate = (
  baseDate: Date | undefined,
  daysToAdd: number,
  timeZone: string = "Asia/Kolkata"
): Date => {
  const now = new Date();

  // If no base date or base date is in the past, start from now
  const effectiveBase = baseDate && isAfter(baseDate, now) ? baseDate : now;

  const baseInTimeZone = toZonedTime(effectiveBase, timeZone);
  const endDateInTimeZone = addDays(baseInTimeZone, daysToAdd);

  // Set to end of the day in the given timezone
  const endOfDayInTimeZone = set(endDateInTimeZone, {
    hours: 23,
    minutes: 59,
    seconds: 0,
    milliseconds: 0,
  });

  // Return converted back to UTC
  return fromZonedTime(endOfDayInTimeZone, timeZone);
};
