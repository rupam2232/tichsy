import { addDays, set } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

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
