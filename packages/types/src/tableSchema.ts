import { z } from "zod";

export const tableSchema = z.object({
  tableName: z.string().min(1, "Table name is required").max(30, "Table name cannot exceed 30 characters").trim(),
  seatCount: z.number().optional(),
});