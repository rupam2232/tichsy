import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { ReceiptTemplate } from "../templates/receipt.template.js";
import { SubscriptionHistory } from "../models/subscriptionHistory.model.js";

export const generateSubscriptionReceiptPdf = async (
  subscription: SubscriptionHistory,
  user: { name: string; email: string; phone?: string; timeZone?: string }
) => {
  return await renderToStream(
    <ReceiptTemplate subscription={subscription} user={user} />
  );
};
