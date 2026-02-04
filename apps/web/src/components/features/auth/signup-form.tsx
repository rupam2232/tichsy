"use client";
import { cn } from "@repo/ui/lib/utils";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { signUpSchema } from "@repo/types";
import { zodResolver } from "@hookform/resolvers/zod";
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
  InputGroupButton,
  InputGroupInput,
} from "@repo/ui/components/input-group";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import axios from "@/utils/axiosInstance";
import { toast } from "sonner";
import { GoogleLogin } from "@react-oauth/google";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { signIn, signOut } from "@/store/authSlice";
import { AxiosError } from "axios";
import type { ApiResponse } from "@repo/ui/types/ApiResponse";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  RotateCcw,
  User,
} from "lucide-react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import Link from "next/link";

export function SignupForm({
  className,
  cardClassName,
  setDrawerOpen,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  cardClassName?: string;
  setDrawerOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/home";
  const [emailSignupLoading, setEmailSignupLoading] = useState<boolean>(false);
  const [googleSignupLoading, setGoogleSignupLoading] =
    useState<boolean>(false);
  const [signupStep, setSignupStep] = useState<1 | 2>(1); // 1 for email, 2 for OTP
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [resendTimer, setResendTimer] = useState<number | null>(null);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [passwordScore, setPasswordScore] = useState<number>(0);

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

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      otp: "",
      fullName: "",
    },
  });

  const handleGoogleLogin = async (idToken: string) => {
    if (!idToken) {
      toast.error("Google signup failed. Please try again.");
      return;
    }
    setGoogleSignupLoading(true);
    try {
      const response = await axios.post("/auth/google", { idToken });
      dispatch(signIn(response.data.data));
      toast.success(response.data.message || "Sign up successful!");
      if (
        response.data?.message &&
        response.data.message.toLowerCase().includes("sign up")
      ) {
        router.replace("/home?from=signup");
      } else {
        router.replace(redirectTo);
      }
      if (setDrawerOpen) {
        setDrawerOpen(false);
      }
    } catch (error) {
      dispatch(signOut());
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Google sign up failed. Please try again.",
      );
      console.error(
        axiosError.response?.data.message ||
          "An error occurred during Google sign up",
      );
    } finally {
      setGoogleSignupLoading(false);
    }
  };

  const sendOtp = async () => {
    if (isSendingOtp) {
      toast.info("OTP is already being sent. Please wait.");
      return;
    }
    if (
      resendTimer !== null ||
      (typeof resendTimer === "number" && resendTimer > 0)
    ) {
      toast.info(`Please wait ${resendTimer} seconds before resending OTP.`);
      return;
    }
    const email = form.getValues("email");
    const name = form.getValues("fullName");
    if (!email) {
      form.setError("email", {
        type: "manual",
        message: "Please enter your email to receive the OTP.",
      });
      toast.error("Please enter your email to receive the OTP.");
      return;
    }
    if (!name) {
      form.setError("fullName", {
        type: "manual",
        message: "Please enter your full name to receive the OTP.",
      });
      toast.error("Please enter your full name to receive the OTP.");
      return;
    }
    try {
      setIsSendingOtp(true);
      const response = await axios.post("/otp/send", {
        email,
        name,
        context: "signup",
      });
      if (response.data.data === false) {
        toast.error("Failed to send OTP. Please try again");
        return;
      }
      form.setValue("otp", ""); // Clear the OTP field before sending a new OTP
      toast.success(response.data.message || "OTP sent successfully!");
      startResendTimer();
      setIsOtpSent(true);
    } catch (error) {
      setSignupStep(1);
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Failed to send OTP. Please try again.",
      );
      console.error(
        axiosError.response?.data.message ||
          "An error occurred while sending OTP",
      );
    } finally {
      setIsSendingOtp(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    if (!data.otp || data.otp.length !== 6) {
      form.setError("otp", {
        type: "manual",
        message: "Please enter a valid 6-digit OTP",
      });
      return;
    }
    setEmailSignupLoading(true);
    try {
      const response = await axios.post("/auth/signup", data);
      dispatch(signIn(response.data.data));
      toast.success(response.data.message || "Sign up successful!");
      router.replace("/home?from=signup");
      if (setDrawerOpen) {
        setDrawerOpen(false);
      }
    } catch (error) {
      dispatch(signOut());
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Sign up failed. Please check your credentials",
      );
      console.error(
        axiosError.response?.data.message || "An error occurred during Sign up",
      );
    } finally {
      setEmailSignupLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className={cn("overflow-hidden p-0", cardClassName)}>
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="bg-muted relative hidden md:block">
            <Image
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              src="/placeholder.png"
              alt="Image"
              priority={true}
              className="absolute inset-0 h-full w-full object-cover object-left"
            />
          </div>
          <Form {...form}>
            <form
              className="md:h-[84vh] overflow-y-auto overflow-x-hidden"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-6 p-6 md:p-8">
                  <div className="flex flex-col items-center text-center">
                    <h1 className="text-2xl font-bold">{`Welcome to ${process.env.NEXT_PUBLIC_APP_NAME}`}</h1>
                    <p className="text-muted-foreground text-balance">
                      {`Create an account to get started with ${process.env.NEXT_PUBLIC_APP_NAME}`}
                    </p>
                  </div>

                  <div className="relative">
                    {googleSignupLoading ? (
                      <Button
                        disabled
                        className="w-full font-normal bg-white text-black border-zinc-400 border rounded-[4px] py-4.5"
                      >
                        <Loader2 className="animate-spin !h-5 !w-5" />
                        Signing up with Google...
                      </Button>
                    ) : (
                      <GoogleLogin
                        onSuccess={async (credentialResponse) => {
                          if (!credentialResponse.credential) {
                            toast.error(
                              "Google signup failed. Please try again.",
                            );
                            return;
                          }
                          // Handle the Google signup with the credential
                          handleGoogleLogin(credentialResponse.credential);
                        }}
                        onError={() => {
                          toast.error(
                            "Google signup failed. Please try again.",
                          );
                        }}
                        logo_alignment="center"
                        text="signup_with"
                        useOneTap={true}
                        auto_select={true}
                      />
                    )}
                    {(googleSignupLoading || emailSignupLoading) && (
                      <div className="absolute inset-0 z-10 bg-white opacity-50 cursor-not-allowed" />
                    )}
                  </div>
                  <div className="after:border-ring relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                    <span className="bg-card text-muted-foreground relative z-10 px-2">
                      Or continue with
                    </span>
                  </div>
                  <div className="grid gap-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem
                          className={cn(signupStep !== 1 ? "hidden" : "")}
                        >
                          <FormControl>
                            <InputGroup className="w-full sm:w-auto sm:min-w-[300px] border-zinc-400 has-[[data-slot=input-group-control]:focus-visible]:border-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-1">
                              <InputGroupAddon>
                                <User />
                              </InputGroupAddon>
                              <InputGroupInput
                                id="full-name"
                                placeholder="Full Name"
                                type="text"
                                autoComplete="name"
                                required
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
                      name="email"
                      render={({ field }) => (
                        <FormItem
                          className={cn(signupStep === 1 ? "" : "hidden")}
                        >
                          <FormControl>
                            <InputGroup className="w-full sm:w-auto sm:min-w-[300px] border-zinc-400 has-[[data-slot=input-group-control]:focus-visible]:border-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-1">
                              <InputGroupAddon>
                                <Mail />
                              </InputGroupAddon>
                              <InputGroupInput
                                id="email"
                                placeholder="Email"
                                type="email"
                                autoComplete="username"
                                required
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
                      name="password"
                      render={({ field }) => (
                        <FormItem
                          className={cn(signupStep === 1 ? "" : "hidden")}
                        >
                          <FormControl>
                            <PasswordInput
                              id="password"
                              placeholder="Password"
                              autoComplete="new-password"
                              required
                              {...field}
                            >
                              <PasswordInputStrengthChecker
                                onScoreChange={(score) =>
                                  setPasswordScore(score)
                                }
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
                      render={({ field }) => (
                        <FormItem
                          className={cn(signupStep === 1 ? "" : "hidden")}
                        >
                          <FormControl>
                            <InputGroup className="w-full sm:w-auto sm:min-w-[300px] border-zinc-400 has-[[data-slot=input-group-control]:focus-visible]:border-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-1">
                              <InputGroupAddon>
                                <LockKeyhole />
                              </InputGroupAddon>
                              <InputGroupInput
                                id="confirm-password"
                                placeholder="Confirm Password"
                                type={showConfirmPassword ? "text" : "password"}
                                autoComplete="new-password"
                                required
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
                    <Button
                      onClick={() => setSignupStep(1)}
                      className={cn(
                        "w-min mr-auto bg-transparent hover:bg-primary/10 text-primary",
                        signupStep === 2 ? "" : "hidden",
                      )}
                      type="button"
                    >
                      <ArrowLeft />
                      Back
                    </Button>
                    <FormField
                      control={form.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem
                          className={cn("", signupStep === 2 ? "" : "hidden")}
                        >
                          <FormLabel htmlFor="otp">
                            Enter OTP sent to {form.getValues("email")}
                          </FormLabel>
                          <FormControl>
                            <InputOTP
                              disabled={!isOtpSent || isSendingOtp}
                              id="otp"
                              pattern={REGEXP_ONLY_DIGITS}
                              maxLength={6}
                              {...field}
                            >
                              <InputOTPGroup className="gap-3">
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
                            onClick={() => sendOtp()}
                            disabled={isSendingOtp || resendTimer !== null}
                            className={`w-min ml-auto bg-transparent hover:bg-primary/10 text-primary`}
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
                          <FormDescription>
                            Please enter the 6-digit OTP sent to your email. If
                            not found in your inbox, check your spam folder.
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    className={cn("w-full", signupStep === 2 ? "hidden" : "")}
                    onClick={() => {
                      if (signupStep === 1) {
                        // Validate the first step
                        form.handleSubmit(() => {
                          if (passwordScore < 3) {
                            form.setError("password", {
                              type: "manual",
                              message:
                                "Password is too weak. Please use a stronger password.",
                            });
                            return;
                          }
                          sendOtp();
                          setSignupStep(2);
                        })();
                      }
                    }}
                  >
                    Continue to OTP
                  </Button>

                  <Button
                    type="submit"
                    className={cn("w-full", signupStep === 1 ? "hidden" : "")}
                    disabled={emailSignupLoading || googleSignupLoading}
                  >
                    {emailSignupLoading ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Signing up...
                      </>
                    ) : (
                      "Sign up"
                    )}
                  </Button>
                  <div className="text-center text-sm">
                    Already have an account?{" "}
                    <Link
                      href={`/signin?redirect=${redirectTo}`}
                      onClick={() => setDrawerOpen && setDrawerOpen(false)}
                      className="underline underline-offset-4"
                    >
                      Sign in
                    </Link>
                  </div>
                  <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs *:[a]:underline *:[a]:underline-offset-4">
                    By clicking continue, you agree to our{" "}
                    <Link href="#">Terms of Service</Link> and{" "}
                    <Link href="#">Privacy Policy</Link>.
                  </div>
                </div>
              </ScrollArea>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
