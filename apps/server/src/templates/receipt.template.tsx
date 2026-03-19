import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";
import { SubscriptionHistory } from "../models/subscriptionHistory.model.js";
import path from "path";
import { formatInTimeZone } from "date-fns-tz";
import { subDays } from "date-fns";
import { env } from "../env.js";

const fontPath = path.join(
  process.cwd(),
  "src",
  "fonts",
  "Noto_Sans",
  "static",
  "NotoSans-Medium.ttf"
);

Font.register({
  family: "NotoSans",
  src: fontPath,
});

interface ReceiptProps {
  subscription: SubscriptionHistory;
  user: {
    name: string;
    email: string;
    phone?: string;
    timeZone?: string;
  };
}

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitle: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 4,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 10,
    color: "#6B7280",
    marginBottom: 2,
  },
  value: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 15,
  },
  table: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  col1: { width: "50%" },
  col2: { width: "25%", textAlign: "right" },
  col3: { width: "25%", textAlign: "right" },
  textSm: { fontSize: 10 },
  textBase: { fontSize: 12 },
  textBold: { fontWeight: "bold" },

  summarySection: {
    marginTop: 20,
    alignSelf: "flex-end",
    width: "40%",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 10,
    textTransform: "uppercase",
  },
  statusPaid: {
    backgroundColor: "#15ab6d",
    color: "#FFFFFF",
  },
});

export const ReceiptTemplate = ({ subscription, user }: ReceiptProps) => {
  const formatDate = (date: Date | undefined) => {
    return date
      ? formatInTimeZone(date, user.timeZone || "Asia/Kolkata", "dd MMMM yyyy")
      : "-";
  };

  // Calculate previous subscription end date (day before activation)
  const getPreviousSubEndDate = (activationDate: Date | undefined) => {
    if (!activationDate) return undefined;
    return subDays(new Date(activationDate), 1);
  };

  const formatCurrency = (amount: number | undefined) => {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        <Text style={{ fontFamily: "NotoSans" }}>₹</Text>
        <Text>{(amount || 0).toFixed(2)}</Text>
      </View>
    );
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: "column", alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image src={env.APP_LOGO_URL} style={styles.logo} />
              <Text style={styles.title}>Tichsy</Text>
            </View>
            <Text style={styles.subtitle}>Payment Receipt</Text>
          </View>
          <View style={[styles.statusBadge, styles.statusPaid]}>
            <Text>PAID</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Info Grid */}
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {/* Bill To */}
          <View style={{ width: "45%" }}>
            <Text style={styles.label}>BILLED TO</Text>
            <Text style={styles.value}>{user.name}</Text>
            <Text style={styles.value}>{user.email}</Text>
            {user.phone && <Text style={styles.value}>{user.phone}</Text>}
          </View>

          {/* Transaction Info */}
          <View
            style={{
              width: "45%",
              alignItems: "flex-end",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                marginBottom: 8,
                alignItems: "flex-end",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
              }}
            >
              <Text style={styles.label}>TRANSACTION ID</Text>
              <Text style={styles.value}>
                {subscription.transactionId || "-"}
              </Text>
            </View>
            <View
              style={{
                alignItems: "flex-end",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
              }}
            >
              <Text style={styles.label}>DATE</Text>
              <Text style={styles.value}>
                {formatDate(subscription.createdAt)}
              </Text>
            </View>
            {subscription.isScheduled && (
              <View
                style={{
                  marginTop: 8,
                  alignItems: "flex-end",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                }}
              >
                <Text style={styles.label}>ACTIVATION DATE</Text>
                <Text style={[styles.value]}>
                  {formatDate(subscription.subscriptionStartDate)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.col1}>
              <Text style={[styles.textSm, styles.textBold]}>DESCRIPTION</Text>
            </View>
            <View style={styles.col2}>
              <Text style={[styles.textSm, styles.textBold]}>PERIOD</Text>
            </View>
            <View style={styles.col3}>
              <Text style={[styles.textSm, styles.textBold]}>AMOUNT</Text>
            </View>
          </View>

          <View style={styles.tableRow}>
            <View style={styles.col1}>
              <Text style={styles.textBase}>
                {subscription.plan
                  ? subscription.plan.charAt(0).toUpperCase() +
                    subscription.plan.slice(1)
                  : "Plan"}{" "}
                Subscription
              </Text>
            </View>
            <View style={styles.col2}>
              <Text style={styles.textBase}>{subscription.period}</Text>
            </View>
            <View style={styles.col3}>
              <View style={styles.textBase}>
                {formatCurrency(subscription.subtotal)}
              </View>
            </View>
          </View>
        </View>

        {/* Pricing Breakdown */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.textSm}>Subtotal</Text>
            <View style={styles.textSm}>
              {formatCurrency(subscription.subtotal)}
            </View>
          </View>

          {subscription.discountAmount && subscription.discountAmount > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={[styles.textSm, { color: "#10B981" }]}>
                Discount ({subscription.discountReason})
              </Text>
              <View style={[styles.textSm, { color: "#10B981" }]}>
                -{formatCurrency(subscription.discountAmount)}
              </View>
            </View>
          ) : null}

          <View style={styles.summaryRow}>
            <Text style={styles.textSm}>Processing Fees (Tax incl.)</Text>
            <View style={styles.textSm}>
              {formatCurrency(subscription.taxAmount)}
            </View>
          </View>

          <View style={styles.totalRow}>
            <Text style={[styles.textBase, styles.textBold]}>TOTAL</Text>
            <View style={[styles.textBase, styles.textBold]}>
              {formatCurrency(
                subscription.totalAmount || (subscription.amount as number)
              )}
            </View>
          </View>
        </View>

        {/* Scheduled Activation Notice */}
        {subscription.isScheduled && (
          <View
            style={{
              marginTop: 20,
              padding: 12,
              backgroundColor: "#EFF6FF",
              borderRadius: 4,
              borderLeftWidth: 4,
              borderLeftColor: "#3B82F6",
            }}
          >
            <View>
              <Text style={{ fontSize: 8, color: "#3B82F6" }}>
                This plan activates after the previous subscription ends on{" "}
                {formatDate(
                  getPreviousSubEndDate(subscription.subscriptionStartDate)
                )}
                .
              </Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View
          style={{
            marginTop: 40,
            borderTopWidth: 1,
            borderColor: "#E5E7EB",
            paddingTop: 20,
          }}
        >
          <Text style={{ fontSize: 10, color: "#9CA3AF", textAlign: "center" }}>
            This is a computer-generated receipt and does not require a physical
            signature.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
