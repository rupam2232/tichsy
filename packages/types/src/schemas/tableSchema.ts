import { z } from "zod";

export const tableSchema = z.object({
  tableName: z
    .string("Table name must be a string")
    .trim()
    .min(1, "Table name is required")
    .max(30, "Table name cannot exceed 30 characters"),
  seatCount: z
    .number("Seat count must be a number")
    .int("Seat count must be an integer")
    .positive("Seat count must be a positive number")
    .optional(),
});
