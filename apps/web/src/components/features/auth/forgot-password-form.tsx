"use client";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@repo/ui/components/card";
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
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@repo/ui/components/input-group";
import {
  ChevronLeft,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  RotateCcw,
  Send,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { forgotPasswordSchema } from "@repo/types";
import {
  PasswordInput,
  PasswordInputRequirements,
  PasswordInputStrengthChecker,
} from "@repo/ui/components/password-input";
import { Button } from "@repo/ui/components/button";
import { useRouter } from "next/navigation";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@repo/ui/components/input-otp";
import { toast } from "sonner";
import axios from "@/utils/axiosInstance";
import { AxiosError } from "axios";
import { ApiResponse } from "@repo/types";

const ForgotPasswordForm = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [passwordScore, setPasswordScore] = useState<number>(0);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [resendTimer, setResendTimer] = useState<number | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      otp: "",
    },
  });

  const startResendTimer = () => {
    let delay = 60; // seconds
    const timeout = setInterval(() => {
      setResendTimer(delay);
      delay -= 1;
      if (delay <= 0) {
        setResendTimer(null);
        clearInterval(timeout);
      }
    }, 1000);
  };

  const sendOtp = async () => {
    if (isSendingOtp) {
      toast.info("OTP is already being sent. Please wait.");
      setStep(2);
      return;
    }
    if (
      resendTimer !== null ||
      (typeof resendTimer === "number" && resendTimer > 0)
    ) {
      toast.info(`Please wait ${resendTimer} seconds before resending OTP.`);
      setStep(2);
      return;
    }
    const email = form.getValues("email");
    if (!email) {
      form.setError("email", {
        type: "manual",
        message: "Please enter your email to receive the OTP.",
      });
      toast.error("Please enter your email to receive the OTP.");
      setStep(1);
      return;
    }
    const toastId = toast.loading("Sending OTP...");
    try {
      setIsSendingOtp(true);
      const response = await axios.post("/otp/send", {
        email,
        context: "forgot-password",
      });
      if (response.data.data === false) {
        toast.error("Failed to send OTP. Please try again");
        return;
      }
      form.resetField("otp"); // Reset the OTP field before sending a new OTP
      toast.success(response.data.message || "OTP sent successfully!", {
        id: toastId,
      });
      startResendTimer();
      setIsOtpSent(true);
      setStep(2);
    } catch (error) {
      setStep(1);
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Failed to send OTP. Please try again.",
        {
          id: toastId,
        },
      );
      console.error(
        axiosError.response?.data.message ||
          "An error occurred while sending OTP",
      );
      if (axiosError.response?.data.message.includes("email")) {
        form.setError("email", {
          type: "manual",
          message: axiosError.response?.data.message,
        });
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleContinue = async () => {
    if (step === 1) {
      const isValid = await form.trigger("email");
      if (isValid) {
        sendOtp();
      }
    }
  };

  const onSubmit = async (data: z.infer<typeof forgotPasswordSchema>) => {
    if (form.formState.isLoading || isSendingOtp) {
      return;
    }
    if (passwordScore < 3) {
      form.setError("password", {
        type: "manual",
        message: "Password is too weak. Please use a stronger password.",
      });
      setStep(2);
      return;
    }

    try {
      const response = await axios.post("/auth/forgot-password", data);
      toast.success(response.data.message || "Password reset successful!");
      form.reset();
      router.replace("/signin");
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Password reset failed. Please check your credentials",
      );
      console.error(
        axiosError.response?.data.message ||
          "An error occurred during Password reset",
      );
    }
  };

  return (
    <div className="flex h-auto items-center justify-center py-10 sm:px-6 lg:px-8">
      <Card className="w-full border-none shadow-md sm:max-w-md max-h-[84vh] overflow-y-auto overflow-x-hidden custom-scrollbar">
        <CardHeader>
          <CardTitle className="mb-1.5 text-2xl">Forgot Password?</CardTitle>
          <CardDescription>
            Enter your email address and we will send you a OTP to reset your
            password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className=""
              onSubmit={form.handleSubmit(onSubmit)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (step === 1) {
                    e.preventDefault();
                    handleContinue();
                  }
                }
              }}
            >
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <FormItem className={cn(step === 1 ? "" : "hidden")}>
                      <FormControl>
                        <InputGroup className="w-full border-zinc-400 has-[[data-slot=input-group-control]:focus-visible]:border-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-1">
                          <InputGroupAddon>
                            <Mail />
                          </InputGroupAddon>
                          <InputGroupInput
                            id="email"
                            placeholder="Email"
                            type="email"
                            autoComplete="username"
                            required
                            aria-invalid={fieldState.invalid}
                            {...field}
                          />
                        </InputGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="otp"
                  render={({ field, fieldState }) => (
                    <FormItem className={cn("", step === 2 ? "" : "hidden")}>
                      <FormLabel htmlFor="otp">
                        Enter OTP sent to {form.getValues("email")}
                      </FormLabel>
                      <FormControl>
                        <InputOTP
                          disabled={!isOtpSent || isSendingOtp}
                          id="otp"
                          maxLength={6}
                          containerClassName="w-full"
                          aria-invalid={fieldState.invalid}
                          {...field}
                        >
                          <InputOTPGroup className="gap-2 sm:gap-3 md:gap-4">
                            <InputOTPSlot index={0} className="w-10 h-10" />
                            <InputOTPSlot index={1} className="w-10 h-10" />
                            <InputOTPSlot index={2} className="w-10 h-10" />
                            <InputOTPSlot index={3} className="w-10 h-10" />
                            <InputOTPSlot index={4} className="w-10 h-10" />
                            <InputOTPSlot index={5} className="w-10 h-10" />
                          </InputOTPGroup>
                        </InputOTP>
                      </FormControl>
                      <FormMessage />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => sendOtp()}
                        disabled={isSendingOtp || resendTimer !== null}
                        className="w-min ml-auto"
                      >
                        <RotateCcw
                          className={cn(
                            isSendingOtp ? "animate-spin-reverse" : "",
                          )}
                        />{" "}
                        {resendTimer
                          ? `${resendTimer}s`
                          : isSendingOtp
                            ? "Sending OTP"
                            : isOtpSent
                              ? "Resend OTP"
                              : "Send OTP"}
                      </Button>
                      <FormDescription className="text-xs">
                        Please enter the 6-digit OTP sent to your email. If not
                        found in your inbox, check your spam folder.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className={cn(step === 2 ? "" : "hidden")}>
                      <FormControl>
                        <PasswordInput
                          id="password"
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
                    <FormItem className={cn(step === 2 ? "" : "hidden")}>
                      <FormControl>
                        <InputGroup className="w-full border-zinc-400 has-[[data-slot=input-group-control]:focus-visible]:border-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-1">
                          <InputGroupAddon>
                            <LockKeyhole />
                          </InputGroupAddon>
                          <InputGroupInput
                            id="confirm-password"
                            placeholder="Confirm New Password"
                            type={showConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            required
                            aria-invalid={fieldState.invalid}
                            {...field}
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupButton
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
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    className={cn("w-full", step === 2 ? "hidden" : "")}
                    onClick={handleContinue}
                    disabled={isSendingOtp}
                  >
                    Send OTP <Send />
                  </Button>
                  <Button
                    type="submit"
                    className={cn("w-full", step === 2 ? "" : "hidden")}
                    disabled={isSendingOtp || form.formState.isSubmitting}
                  >
                    {isSendingOtp ? (
                      <>
                        <Loader2 className="animate-spin" /> Sending OTP...
                      </>
                    ) : form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" /> Resetting
                        Password...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    type="button"
                    className="w-full group"
                    onClick={() => {
                      if (step === 1) {
                        router.push("/signin");
                      } else {
                        setStep(1);
                      }
                    }}
                  >
                    <ChevronLeft className="size-5 transition-transform duration-200 group-hover:-translate-x-0.5" />
                    {step === 1 ? "Back to login" : "Go back"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordForm;
