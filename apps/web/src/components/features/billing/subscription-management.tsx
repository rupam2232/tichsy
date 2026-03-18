"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Badge } from "@repo/ui/components/badge";
import { Separator } from "@repo/ui/components/separator";
import { Calendar, Circle, CreditCard, AlertCircle, Clock } from "lucide-react";
import { CurrentPlan } from "@/lib/billingsdk-config";
import { cn } from "@repo/ui/lib/utils";
import {
  UpdatePlanDialog,
  type UpdatePlanDialogProps,
} from "./update-plan-dialog";
import { CurrentSubscription } from "@repo/types";

export interface SubscriptionManagementProps {
  className?: string;
  currentPlan: CurrentPlan;
  updatePlan: UpdatePlanDialogProps;
  isInGracePeriod?: boolean;
  pendingPlan?: CurrentSubscription["pendingPlan"];
  daysUntilExpiry?: number | null;
}

export function SubscriptionManagement({
  className,
  currentPlan,
  updatePlan,
  isInGracePeriod,
  pendingPlan,
  daysUntilExpiry,
}: SubscriptionManagementProps) {
  return (
    <div className={cn("w-full text-left", className)}>
      <Card>
        <CardHeader className="px-4 pb-4 sm:px-6 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:gap-3 sm:text-xl">
            <div className="bg-muted rounded-lg p-1.5 sm:p-2">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            Current Subscription
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Manage your billing and subscription settings
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-4 sm:space-y-8 sm:px-6">
          {/* Grace period alert */}
          {isInGracePeriod && (
            <div className="border-yellow-500/50 bg-yellow-500/5 flex gap-3 rounded-lg border p-3 sm:p-4">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                Your subscription has ended but you&apos;re still within the grace period. You can renew your plan or it will be downgraded to starter after the grace period ends.
              </div>
            </div>
          )}

          {/* Pending plan alert */}
          {/* {pendingPlan && (
            <div className="border-blue-500/50 bg-blue-500/5 flex gap-3 rounded-lg border p-3 sm:p-4">
              <Clock className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                You have scheduled a plan change to <strong>{pendingPlan.plan}</strong> ({pendingPlan.period}). It will activate when your current subscription ends.
              </div>
            </div>
          )} */}

          {/* Expiry warning for Paid users */}
          {currentPlan.status === "active" &&
            currentPlan.plan.id !== "starter" &&
            daysUntilExpiry !== undefined &&
            daysUntilExpiry !== null &&
            daysUntilExpiry <= 7 &&
            daysUntilExpiry > 0 && (
              <div className="border-orange-500/50 bg-orange-500/5 flex gap-3 rounded-lg border p-3 sm:p-4">
                <Clock className="h-5 w-5 flex-shrink-0 text-orange-600 dark:text-orange-400 mt-0.5" />
                <div className="text-sm text-orange-800 dark:text-orange-200">
                  Your subscription expires in <strong>{daysUntilExpiry} {daysUntilExpiry === 1 ? 'day' : 'days'}</strong>. Renew now to maintain your premium features.
                </div>
              </div>
            )}
          {/* Current Plan Details with highlighted styling */}
          <div className="from-muted/50 via-muted/40 to-muted/50 border-border/50 relative overflow-hidden rounded-xl border bg-gradient-to-r p-3 sm:p-4">
            <div className="relative">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                <div className="w-full">
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold sm:text-xl">
                        {currentPlan.status === "active"
                          ? `${currentPlan.plan.title} Plan`
                          : "No Active Plan"}
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {currentPlan.status === "active" && (
                        <Badge
                          variant={
                            currentPlan.status === "active"
                              ? "default"
                              : "outline"
                          }
                          className="bg-primary/90 hover:bg-primary border-0 text-xs font-medium shadow-sm sm:text-sm"
                        >
                          {currentPlan.type === `monthly`
                            ? `${currentPlan.plan.currency}${currentPlan.plan.monthlyPrice}/month`
                            : currentPlan.type === `yearly`
                              ? `${currentPlan.plan.currency}${currentPlan.plan.yearlyPrice}/year`
                              : `${currentPlan.price}`}
                        </Badge>
                      )}
                      {currentPlan.status === "active" && (
                        <Badge
                          variant="outline"
                          className="border-border/60 bg-background/50 text-xs shadow-sm backdrop-blur-sm sm:text-sm"
                        >
                          {currentPlan.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <p className="text-muted-foreground relative z-10 text-xs sm:text-sm">
                      {currentPlan.status === "active"
                        ? currentPlan.plan.description
                        : "You currently have no active subscription. Upgrade to a plan to unlock features."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator className="via-border my-4 bg-gradient-to-r from-transparent to-transparent sm:my-6" />

          <div className="space-y-3 sm:space-y-4">
            <h4 className="flex items-center gap-2 text-base font-medium sm:text-lg">
              <div className="bg-muted ring-border/50 rounded-md p-1 ring-1 sm:p-1.5">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
              Billing Information
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6">
              <div className="group from-muted to-background/10 border-border/30 hover:border-border/60 rounded-lg border bg-gradient-to-b p-2.5 transition-all duration-200 sm:p-3 md:bg-gradient-to-tl">
                <span className="text-muted-foreground mb-1 block text-xs sm:text-sm">
                  Start Date
                </span>
                <div className="text-sm font-medium transition-colors duration-200 sm:text-base">
                  {currentPlan.startDate || "-"}
                </div>
              </div>
              <div className="group from-muted to-background/10 border-border/30 hover:border-border/60 rounded-lg border bg-gradient-to-b p-2.5 transition-all duration-200 sm:p-3 md:bg-gradient-to-tr">
                <span className="text-muted-foreground mb-1 block text-xs sm:text-sm">
                  End Date
                </span>
                <div className="text-sm font-medium transition-colors duration-200 sm:text-base">
                  {currentPlan.endDate || "-"}
                </div>
              </div>
            </div>

            {/* Additional info about grace period and downgrade */}
            {currentPlan.status === "active" &&
              currentPlan.plan.id !== "starter" && (
                <div className="text-muted-foreground mt-4 rounded-lg border border-dashed border-border/50 bg-muted/20 p-3 text-xs sm:text-sm">
                  <p className="leading-relaxed">
                    📌 If you don&apos;t renew after the end date, you&apos;ll have a{" "}
                    <strong>1-day grace period</strong> to keep your premium
                    features active. After that, your plan will automatically
                    downgrade to the free <strong>Starter</strong> plan.
                  </p>
                  {!pendingPlan && (
                    <p className="mt-2 leading-relaxed">
                      💡 You can schedule a plan change to a different tier. The new plan will activate automatically when your current subscription ends.
                    </p>
                  )}
                </div>
              )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {pendingPlan ? (
              // Show info message instead of button when pending plan exists
              <div className="w-full rounded-lg border border-blue-500/50 bg-blue-500/10 p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Plan Change Scheduled
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  You have already scheduled a plan change to <strong>{pendingPlan.plan}</strong> ({pendingPlan.period}).
                  This change will take effect automatically when your current subscription ends.
                  You cannot make additional plan changes until the scheduled change is activated.
                </p>
              </div>
            ) : (
              <UpdatePlanDialog
                className="mx-0 shadow-lg transition-all duration-200 hover:shadow-xl"
                {...updatePlan}
              />
            )}
          </div>

          <Separator className="via-border my-4 bg-gradient-to-r from-transparent to-transparent sm:my-6" />

          {currentPlan.status === "active" && (
            <div>
              <h4 className="mb-3 text-base font-medium sm:mb-4 sm:text-lg">
                Current Plan Features
              </h4>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {currentPlan.plan.features.map((feature, index) => (
                  <div
                    key={index}
                    className="group border-border hover:border-primary/30 hover:bg-primary/5 flex items-center gap-2 rounded-lg border p-2 transition-all duration-200 sm:p-2"
                  >
                    <Circle className="fill-primary text-primary h-2 w-2 group-hover:scale-125 transition-all duration-200" />
                    <span className="text-muted-foreground group-hover:text-foreground text-xs transition-colors duration-200 sm:text-sm">
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
