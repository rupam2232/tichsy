"use client";

import { cn } from "@repo/ui/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { Badge } from "@repo/ui/components/badge";
import { CalendarDays, Clock, Download, ReceiptText } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { ScrollArea, ScrollBar } from "@repo/ui/components/scroll-area";

export interface InvoiceItem {
  id: string;
  date: string;
  amount: string;
  status: "paid" | "refunded" | "open" | "void" | "free";
  invoiceUrl?: string;
  description?: string;
  isScheduled?: boolean;
  activationDate?: string;
}

interface InvoiceHistoryProps {
  className?: string;
  title?: string;
  description?: string;
  invoices: InvoiceItem[];
  onDownload?: (invoiceId: string) => void;
}

export function InvoiceHistory({
  className,
  title = "Invoice History",
  description = "Your past invoices and payment receipts.",
  invoices,
  onDownload,
}: InvoiceHistoryProps) {
  if (!invoices) return null;

  const statusBadge = (status: InvoiceItem["status"]) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="border-emerald-700/40 bg-emerald-600 text-emerald-50">
            Paid
          </Badge>
        );
      case "refunded":
        return <Badge variant="secondary">Refunded</Badge>;
      case "open":
        return <Badge variant="outline">Open</Badge>;
      case "void":
        return <Badge variant="outline">Void</Badge>;
      case "free":
        return <Badge className="bg-chart-2 text-white">Free</Badge>;
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      {(title || description) && (
        <CardHeader className="space-y-1">
          {title && (
            <CardTitle>
              <h3 className="flex items-center gap-2 truncate leading-tight font-medium sm:gap-3 text-lg sm:text-xl text-wrap">
                <ReceiptText className="size-4" />
                {title}
              </h3>
            </CardTitle>
          )}
          {description && (
            <CardDescription>
              <p className="text-muted-foreground text-sm">{description}</p>
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent>
        <ScrollArea className="max-w-[calc(100vw-5rem)] sm:max-w-full overflow-x-auto">
          <Table>
            <TableCaption className="sr-only">
              List of past invoices with dates, amounts, status and download
              actions
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground h-24 text-center"
                  >
                    No invoices yet
                  </TableCell>
                </TableRow>
              )}
              {invoices.map((inv) => (
                <TableRow key={inv.id} className="group">
                  <TableCell className="text-muted-foreground">
                    <div className="inline-flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {inv.date}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[320px] min-w-0">
                    <div className="flex flex-col gap-1">
                      <span title={inv.description || "Invoice"} className="truncate">
                        {inv.description || "Invoice"}
                      </span>
                      {inv.isScheduled && (
                        <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                          <Clock className="h-3 w-3" />
                          <span>Activation date: {inv.activationDate}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {inv.amount}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-1">
                      {statusBadge(inv.status)}
                      {inv.isScheduled && (
                        <Badge className="border-blue-500/40 bg-blue-500 text-blue-50 text-[10px] px-1.5 py-0">
                          Scheduled
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() =>
                        inv.invoiceUrl
                          ? window.open(
                              inv.invoiceUrl,
                              "_blank",
                              "noopener,noreferrer",
                            )
                          : onDownload?.(inv.id)
                      }
                      aria-label={`Download invoice ${inv.id}`}
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="sr-only">Download</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
