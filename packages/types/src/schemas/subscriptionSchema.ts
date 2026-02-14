import { z } from "zod";

export const createSubscriptionSchema = z.object({
  plan: z.enum(["starter", "medium", "pro"]),
  period: z.enum(["monthly", "yearly"]),
});

export const createOrUpdateSubscriptionSchema = z.object({
  plan: z.enum(["starter", "medium", "pro"]),
  isTrial: z.boolean().optional(),
  trialExpiresAt: z.string().or(z.date()).optional(),
  subscriptionStartDate: z.string().or(z.date()).optional(),
  subscriptionEndDate: z.string().or(z.date()).optional(),
});
