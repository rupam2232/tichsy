import { z } from "zod";

export const verifyPaymentSchema = z.object({
  paymentId: z
    .string("Payment ID must be a string")
    .min(1, "Payment ID is required"),
  orderId: z
    .string("Order ID must be a string")
    .min(1, "Order ID is required"),
  signature: z
    .string("Signature must be a string")
    .min(1, "Signature is required"),
});
