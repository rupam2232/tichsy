import { z } from "zod";

export const createSubscriptionSchema = z.object({
  plan: z.enum(["starter", "medium", "pro"]),
  period: z.enum(["monthly", "yearly"]),
});
