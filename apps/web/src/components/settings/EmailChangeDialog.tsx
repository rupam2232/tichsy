"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
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
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@repo/ui/components/input-group";
import axios from "@/utils/axiosInstance";
import { toast } from "sonner";
import { AxiosError } from "axios";
import type { ApiResponse } from "@repo/types";
import { verifyCurrentEmailSchema, changeEmailSchema } from "@repo/types";
import { Loader2, Mail, RotateCcw, Send } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { cn } from "@repo/ui/lib/utils";
import { signOut, updateProfile } from "@/store/authSlice";
import { useRouter } from "next/navigation";

export function EmailChangeDialog() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Info, 2: Current OTP, 3: New Email, 4: New OTP
  const [actionToken, setActionToken] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const dispatch = useDispatch();

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

  const currentEmailForm = useForm<z.infer<typeof verifyCurrentEmailSchema>>({
    resolver: zodResolver(verifyCurrentEmailSchema),
    defaultValues: { otp: "" },
  });

  const newEmailForm = useForm<z.infer<typeof changeEmailSchema>>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { newEmail: "", otp: "" },
  });

  const sendOtpToCurrentEmail = async () => {
    if (resendTimer !== null && resendTimer > 0) return;
    setIsSendingOtp(true);
    const toastId = toast.loading("Sending OTP to current email...");
    try {
      await axios.post("/otp/send", {
        email: user?.email,
        context: "verify-current-email",
      });
      toast.success("OTP sent successfully", { id: toastId });
      startResendTimer();
      setStep(2);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(axiosError.response?.data?.message || "Failed to send OTP.", {
        id: toastId,
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const sendOtpToNewEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (resendTimer !== null && resendTimer > 0) return;

    const isValid = await newEmailForm.trigger("newEmail");
    if (!isValid) return;
    const newEmail = newEmailForm.getValues("newEmail");
    if (newEmail === user?.email) {
      newEmailForm.setError("newEmail", {
        type: "manual",
        message: "New email cannot be the same as current email",
      });
      return;
    }

    setIsSendingOtp(true);
    const toastId = toast.loading("Sending OTP to new email...");
    try {
      await axios.post("/otp/send", {
        email: newEmail,
        context: "change-email",
      });
      toast.success("Verification OTP sent!", { id: toastId });
      startResendTimer();
      setStep(4);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(axiosError.response?.data?.message || "Failed to send OTP.", {
        id: toastId,
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyCurrentEmail = async (
    data: z.infer<typeof verifyCurrentEmailSchema>,
  ) => {
    setIsLoading(true);
    try {
      const res = await axios.post("/user/email/verify-current", {
        otp: data.otp,
      });
      setActionToken(res.data.data.actionToken); // Backend will return the token
      clearResendTimer();
      setStep(3);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(axiosError.response?.data?.message || "Invalid OTP");
      if (axiosError.status === 401) {
        dispatch(signOut());
        router.push("/signin" + "?redirect=" + window.location.href);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const submitNewEmail = async (data: z.infer<typeof changeEmailSchema>) => {
    setIsLoading(true);
    try {
      const response = await axios.patch("/user/change-email", {
        newEmail: data.newEmail,
        otp: data.otp,
        actionToken,
      });
      toast.success("Email changed successfully");
      setIsOpen(false);
      resetFlow();
      if (user) {
        dispatch(
          updateProfile({
            ...user,
            email: response.data.data.email,
          }),
        );
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data?.message || "Failed to update email",
      );
      if (axiosError.status === 401) {
        dispatch(signOut());
        router.push("/signin" + "?redirect=" + window.location.href);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetFlow = () => {
    setStep(1);
    setActionToken(null);
    currentEmailForm.reset();
    newEmailForm.reset();
    clearResendTimer();
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
        <Button variant="outline">Edit Email</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] transition-all duration-300 overflow-y-auto custom-scrollbar p-5 overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Change Email Address</DialogTitle>
          <DialogDescription>
            {step === 1 || step === 2
              ? "To protect your account, we first need to verify your current email address"
              : "Enter your new email address"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="bg-muted p-4 rounded-md border text-sm">
              <p className="text-muted-foreground mb-1">Current Email</p>
              <p className="font-semibold text-foreground">{user?.email}</p>
            </div>
            <Button onClick={sendOtpToCurrentEmail} disabled={isSendingOtp}>
              {isSendingOtp ? (
                <>
                  <Loader2 className="animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  Send OTP
                  <Send />
                </>
              )}
            </Button>
          </div>
        )}

        {step === 2 && (
          <Form {...currentEmailForm}>
            <form
              onSubmit={currentEmailForm.handleSubmit(verifyCurrentEmail)}
              className="space-y-6"
            >
              <FormField
                control={currentEmailForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center">
                    <FormLabel>Enter OTP sent to {user?.email}</FormLabel>
                    <FormControl>
                      <InputOTP maxLength={6} {...field}>
                        <InputOTPGroup className="gap-2">
                          {Array.from({ length: 6 }).map((_, index) => (
                            <InputOTPSlot
                              key={index}
                              index={index}
                              className="w-10 h-10 border rounded-md"
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
                      className="mt-2"
                    >
                      <RotateCcw
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSendingOtp && "animate-spin-reverse",
                        )}
                      />
                      {resendTimer
                        ? `Resend OTP in ${resendTimer}s`
                        : "Resend OTP"}
                    </Button>
                    <FormDescription className="text-center text-xs">
                      Please enter the 6-digit OTP sent to your email. If not
                      found in your inbox, check your spam folder
                    </FormDescription>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify"
                )}
              </Button>
            </form>
          </Form>
        )}

        {step === 3 && (
          <Form {...newEmailForm}>
            <form onSubmit={sendOtpToNewEmail} className="space-y-6">
              <FormField
                control={newEmailForm.control}
                name="newEmail"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel htmlFor="newEmail">New Email Address</FormLabel>
                    <FormControl>
                      <InputGroup className="w-full border-zinc-400 has-[[data-slot=input-group-control]:focus-visible]:border-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-1">
                        <InputGroupAddon>
                          <Mail />
                        </InputGroupAddon>
                        <InputGroupInput
                          placeholder="new.email@example.com"
                          type="email"
                          aria-invalid={fieldState.invalid}
                          required
                          autoComplete="new-email"
                          id="newEmail"
                          {...field}
                        />
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSendingOtp}>
                {isSendingOtp ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send OTP to New Email
                    <Send />
                  </>
                )}
              </Button>
            </form>
          </Form>
        )}

        {step === 4 && (
          <Form {...newEmailForm}>
            <form
              onSubmit={newEmailForm.handleSubmit(submitNewEmail)}
              className="space-y-6"
            >
              <FormField
                control={newEmailForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center">
                    <FormLabel>
                      Enter OTP sent to {newEmailForm.getValues("newEmail")}
                    </FormLabel>
                    <FormControl>
                      <InputOTP maxLength={6} {...field}>
                        <InputOTPGroup className="gap-2">
                          {Array.from({ length: 6 }).map((_, index) => (
                            <InputOTPSlot
                              key={index}
                              index={index}
                              className="w-10 h-10 border rounded-md"
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
                      onClick={sendOtpToNewEmail}
                      disabled={isSendingOtp || resendTimer !== null}
                      className="mt-2"
                    >
                      <RotateCcw
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSendingOtp && "animate-spin-reverse",
                        )}
                      />
                      {resendTimer
                        ? `Resend OTP in ${resendTimer}s`
                        : "Resend OTP"}
                    </Button>
                    <FormDescription className="text-center text-xs">
                      Please enter the 6-digit OTP sent to your email. If not
                      found in your inbox, check your spam folder
                    </FormDescription>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Confirming...
                  </>
                ) : (
                  "Confirm New Email"
                )}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
