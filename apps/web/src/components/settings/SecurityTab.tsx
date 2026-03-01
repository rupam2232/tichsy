"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { EmailChangeDialog } from "./EmailChangeDialog";
import { PasswordChangeDialog } from "./PasswordChangeDialog";

export default function SecurityTab() {
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Address</CardTitle>
          <CardDescription>
            Update the email address associated with your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Current Email Address
              </p>
              <p className="font-medium mt-1">
                {user?.email || "No email linked"}
              </p>
            </div>
            <EmailChangeDialog />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Change your password. We&apos;ll require your current password and
            email confirmation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordChangeDialog />
        </CardContent>
      </Card>
    </div>
  );
}
