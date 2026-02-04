import type { Metadata } from "next";
import { SigninForm } from "@/components/features/auth/signin-form";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Sign In | ${process.env.NEXT_PUBLIC_APP_NAME}`,
    description: `Sign in to ${process.env.NEXT_PUBLIC_APP_NAME}`,
  };
}

export default function SigninPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <SigninForm />
      </div>
    </div>
  );
}
