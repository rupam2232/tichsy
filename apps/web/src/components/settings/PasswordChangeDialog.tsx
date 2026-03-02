"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@repo/ui/components/input-otp";
import {
  PasswordInput,
  PasswordInputStrengthChecker,
  PasswordInputRequirements,
} from "@repo/ui/components/password-input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
} from "@repo/ui/components/input-group";
import axios from "@/utils/axiosInstance";
import { toast } from "sonner";
import { AxiosError } from "axios";
import type { ApiResponse } from "@repo/types";
import { changePasswordSchema } from "@repo/types";
import {
  Loader2,
  LockKeyhole,
  Eye,
  EyeOff,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { cn } from "@repo/ui/lib/utils";
import { Input } from "@repo/ui/components/input";

export function PasswordChangeDialog() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // 1: Passwords, 2: OTP
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [passwordScore, setPasswordScore] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearResendTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setResendTimer(null);
  };

  const startResendTimer = () => {
    clearResendTimer();
    let delay = 60;
    setResendTimer(delay);
    timerIntervalRef.current = setInterval(() => {
      delay -= 1;
      setResendTimer(delay);
      if (delay <= 0) {
        clearResendTimer();
      }
    }, 1000);
  };

  useEffect(() => {
    return () => clearResendTimer();
  }, []);

  const form = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    mode: "all",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      otp: "",
    },
  });

  const sendOtpToCurrentEmail = async () => {
    const isValid = await form.trigger([
      "currentPassword",
      "newPassword",
      "confirmPassword",
    ]);
    if (!isValid) return;

    if (passwordScore < 3) {
      form.setError("newPassword", {
        type: "manual",
        message: "Password is too weak. Please use a stronger password",
      });
      return;
    }

    if (resendTimer !== null && resendTimer > 0) {
      setStep(2);
      return;
    }

    setIsSendingOtp(true);
    const toastId = toast.loading("Sending OTP...");
    try {
      await axios.post("/otp/send", {
        email: user?.email,
        context: "change-password",
      });
      toast.success("OTP sent successfully", { id: toastId });
      startResendTimer();
      setStep(2);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(axiosError.response?.data?.message || "Failed to send OTP", {
        id: toastId,
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const submitPasswordChange = async (
    data: z.infer<typeof changePasswordSchema>,
  ) => {
    try {
      await axios.patch("/user/change-password", data);
      toast.success("Password changed successfully");
      setIsOpen(false);
      resetFlow();
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data?.message || "Failed to update password",
      );
    }
  };

  const resetFlow = () => {
    setStep(1);
    form.reset();
    clearResendTimer();
    setPasswordScore(0);
    setShowConfirmPassword(false);
    setShowCurrentPassword(false);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetFlow();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Edit Password</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] transition-all duration-300 overflow-y-auto custom-scrollbar p-5 overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Enter your current password and pick a new one"
              : "To protect your account, we first need to verify it's you"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submitPasswordChange)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (step === 1) {
                  e.preventDefault();
                  sendOtpToCurrentEmail();
                }
              }
            }}
            className="space-y-6"
          >
            <div className={cn(step === 1 ? "block space-y-4" : "hidden")}>
              <Input
                className="hidden"
                value={user?.email}
                readOnly
                id="email"
                name="email"
                autoComplete="username"
              />

              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormControl>
                      <InputGroup className="w-full border-zinc-400 has-[[data-slot=input-group-control]:focus-visible]:border-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-1">
                        <InputGroupAddon>
                          <LockKeyhole />
                        </InputGroupAddon>
                        <InputGroupInput
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="Current Password"
                          aria-invalid={fieldState.invalid}
                          autoComplete="off"
                          required
                          {...field}
                        />
                        <InputGroupButton
                          type="button"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                        >
                          {showCurrentPassword ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </InputGroupButton>
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <PasswordInput
                        id="new-password"
                        placeholder="New Password"
                        autoComplete="new-password"
                        required
                        {...field}
                      >
                        <PasswordInputStrengthChecker
                          onScoreChange={(score) => setPasswordScore(score)}
                        />
                        <PasswordInputRequirements />
                      </PasswordInput>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormControl>
                      <InputGroup className="w-full border-zinc-400 has-[[data-slot=input-group-control]:focus-visible]:border-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-1">
                        <InputGroupAddon>
                          <LockKeyhole />
                        </InputGroupAddon>
                        <InputGroupInput
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm New Password"
                          autoComplete="new-password"
                          aria-invalid={fieldState.invalid}
                          required
                          {...field}
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupButton
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                          >
                            {showConfirmPassword ? <Eye /> : <EyeOff />}
                          </InputGroupButton>
                        </InputGroupAddon>
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem
                  className={cn(
                    "flex-col items-center",
                    step === 2 ? "flex" : "hidden",
                  )}
                >
                  <FormLabel>Enter OTP sent to {user?.email}</FormLabel>
                  <FormControl>
                    <InputOTP maxLength={6} {...field}>
                      <InputOTPGroup className="gap-2">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <InputOTPSlot
                            key={index}
                            index={index}
                            className="w-10 h-10 border rounded-md boder-border"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={sendOtpToCurrentEmail}
                    disabled={isSendingOtp || resendTimer !== null}
                    className="w-min"
                  >
                    <RotateCcw
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSendingOtp && "animate-spin-reverse",
                      )}
                    />
                    {resendTimer
                      ? `Resend code in ${resendTimer}s`
                      : "Resend Code"}
                  </Button>
                  <FormDescription className="text-center text-xs">
                    Please enter the 6-digit OTP sent to your email. If not
                    found in your inbox, check your spam folder
                  </FormDescription>
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between">
              {step === 1 ? (
                <>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="button"
                    className="group"
                    onClick={sendOtpToCurrentEmail}
                    disabled={isSendingOtp}
                  >
                    {isSendingOtp && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Continue
                    <ChevronRight className="group-hover:translate-x-1 transition-all" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="group"
                    onClick={() => setStep(1)}
                  >
                    <ChevronLeft className="group-hover:-translate-x-1 transition-all" />
                    Back
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting || isSendingOtp}>
                    {(form.formState.isSubmitting || isSendingOtp) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Confirm Password Change
                  </Button>
                </>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
