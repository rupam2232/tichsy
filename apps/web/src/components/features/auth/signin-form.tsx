"use client";
import { cn } from "@repo/ui/lib/utils";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { signInSchema } from "@repo/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@repo/ui/components/form";
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
import { Eye, EyeOff, Loader2, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";

export function SigninForm({
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
  const [emailLoginLoading, setEmailLoginLoading] = useState(false);
  const [googleLoginLoading, setGoogleLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleGoogleLogin = async (idToken: string) => {
    if (!idToken) {
      toast.error("Google sign in failed. Please try again.");
      return;
    }
    setGoogleLoginLoading(true);
    try {
      const response = await axios.post("/auth/google", { idToken });
      dispatch(signIn(response.data.data));
      toast.success(response.data.message || "Sign in successful!");
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
          "Google sign in failed. Please try again.",
      );
      console.error(
        axiosError.response?.data.message ||
          "An error occurred during Google sign in",
      );
    } finally {
      setGoogleLoginLoading(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof signInSchema>) => {
    setEmailLoginLoading(true);
    try {
      const response = await axios.post("/auth/signin", data);
      dispatch(signIn(response.data.data));
      toast.success(response.data.message || "Sign in successful!");
      router.replace(redirectTo);
      if (setDrawerOpen) {
        setDrawerOpen(false);
      }
    } catch (error) {
      dispatch(signOut());
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Sign in failed. Please check your credentials.",
      );
      console.error(
        axiosError.response?.data.message || "An error occurred during sign in",
      );
    } finally {
      setEmailLoginLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className={cn("overflow-hidden p-0", cardClassName)}>
        <CardContent className="grid p-0 md:grid-cols-2">
          <Form {...form}>
            <form
              className="md:h-[84vh] overflow-y-auto overflow-x-hidden"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-6 p-6 md:p-8">
                  <div className="flex flex-col items-center text-center">
                    <h1 className="text-2xl font-bold">Welcome back</h1>
                    <p className="text-muted-foreground text-balance">
                      {`Login to your ${process.env.NEXT_PUBLIC_APP_NAME} account`}
                    </p>
                  </div>

                  <div className="relative">
                    {googleLoginLoading ? (
                      <Button
                        disabled
                        className="w-full font-normal bg-white text-black border-zinc-400 border rounded-[4px] py-4.5"
                      >
                        <Loader2 className="animate-spin !h-5 !w-5" />
                        Signing in with Google...
                      </Button>
                    ) : (
                      <GoogleLogin
                        onSuccess={async (credentialResponse) => {
                          if (!credentialResponse.credential) {
                            toast.error(
                              "Google sign in failed. Please try again.",
                            );
                            return;
                          }
                          // Handle the Google sign in with the credential
                          handleGoogleLogin(credentialResponse.credential);
                        }}
                        onError={() => {
                          toast.error(
                            "Google sign in failed. Please try again.",
                          );
                        }}
                        logo_alignment="center"
                        useOneTap={true}
                        auto_select={true}
                      />
                    )}
                    {(googleLoginLoading || emailLoginLoading) && (
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
                      name="email"
                      render={({ field }) => (
                        <FormItem>
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
                        <FormItem>
                          <FormControl>
                            <InputGroup className="w-full sm:w-auto sm:min-w-[300px] border-zinc-400 has-[[data-slot=input-group-control]:focus-visible]:border-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-1">
                              <InputGroupAddon>
                                <LockKeyhole />
                              </InputGroupAddon>
                              <InputGroupInput
                                id="password"
                                placeholder="Password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                required
                                {...field}
                              />
                              <InputGroupAddon align="inline-end">
                                <InputGroupButton
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <Eye /> : <EyeOff />}
                                </InputGroupButton>
                              </InputGroupAddon>
                            </InputGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Link
                      href="/forgot-password"
                      onClick={() => setDrawerOpen && setDrawerOpen(false)}
                      className="ml-auto text-sm underline-offset-2 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={emailLoginLoading || googleLoginLoading}
                  >
                    {emailLoginLoading ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                  <div className="text-center text-sm">
                    Don&apos;t have an account?{" "}
                    <Link
                      href={`/signup?redirect=${redirectTo}`}
                      onClick={() => setDrawerOpen && setDrawerOpen(false)}
                      className="underline underline-offset-4"
                    >
                      Sign up
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
          <div className="bg-muted relative hidden md:block">
            <Image
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              src="/placeholder.png"
              alt="Image"
              priority={true}
              className="absolute inset-0 h-full w-full object-cover object-right"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
