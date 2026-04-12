"use client";
import { signIn, signOut } from "@/store/authSlice";
import { AppDispatch } from "@/store/store";
import axios from "@/utils/axiosInstance";
import { useGoogleLogin, useGoogleOneTapLogin } from "@react-oauth/google";
import { ApiResponse } from "@repo/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import { IconBrandGoogle } from "@tabler/icons-react";
import { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

const GoogleLoginButton = <T extends FieldValues>({
  buttonText = "Sign in with Google",
  setDrawerOpen,
  googleLoginLoading,
  setGoogleLoginLoading,
  formRef,
  redirectTo = "/home",
  mode = "signin",
  className,
  ...props
}: {
  buttonText?: string;
  setDrawerOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  googleLoginLoading: boolean;
  setGoogleLoginLoading: React.Dispatch<React.SetStateAction<boolean>>;
  formRef: UseFormReturn<T>;
  redirectTo?: string;
  mode?: "signin" | "signup";
} & React.ComponentProps<typeof Button>) => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const handleGoogleLogin = async ({code, credential}: {code?: string, credential?: string}) => {
    if (!code && !credential) {
      toast.error(
        mode === "signin"
          ? "Google sign in failed. Please try again"
          : "Google sign up failed. Please try again",
      );
      return;
    }
    setGoogleLoginLoading(true);
    const toastId = toast.loading(
      mode === "signin"
        ? "Signing in with Google..."
        : "Signing up with Google...",
    );
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await axios.post("/auth/google", { code, credential, timezone });
      dispatch(signIn(response.data.data));
      formRef.reset();
      toast.success(response.data.message || "Sign in successful", {
        id: toastId,
      });
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
          "Google sign in failed. Please try again",
        { id: toastId },
      );
      console.error(
        axiosError.response?.data.message ||
          "An error occurred during Google sign in",
      );
    } finally {
      setGoogleLoginLoading(false);
    }
  };

  const login = useGoogleLogin({
    onSuccess: ({ code }) => {
      handleGoogleLogin({code});
    },
    onError: (error) => {
      console.log(error);
      toast.error(
        mode === "signin"
          ? "Google sign in failed. Please try again"
          : "Google sign up failed. Please try again",
      );
    },
    flow: "auth-code",
  });

  useGoogleOneTapLogin({
    onSuccess: ({ credential }) => {
      if (!credential) {
        toast.error(
          mode === "signin"
            ? "Google sign in failed. Please try again"
            : "Google sign up failed. Please try again",
        );
        return;
      }
      handleGoogleLogin({credential});
    },
    onError: () => {
      toast.error(
        mode === "signin"
          ? "Google sign in failed. Please try again"
          : "Google sign up failed. Please try again",
      );
    },
    auto_select: true,
  });

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => login()}
        disabled={googleLoginLoading}
        className={cn("w-full", className)}
        {...props}
      >
        {googleLoginLoading ? (
          <>
            <Loader2 className="animate-spin" />
            {mode === "signin"
              ? "Signing in with Google..."
              : "Signing up with Google..."}
          </>
        ) : (
          <>
            <Avatar className="w-5 h-5">
              <AvatarImage
                className="object-contain"
                loading="eager"
                src="https://res.cloudinary.com/rupam-mondal/image/upload/e_background_removal/c_auto,h_40,w_40/google.png"
              />
              <AvatarFallback className="bg-transparent">
                <IconBrandGoogle />
              </AvatarFallback>
            </Avatar>
            {buttonText}
          </>
        )}
      </Button>
    </>
  );
};

export default GoogleLoginButton;
