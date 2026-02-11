import type { Metadata } from "next";
import { SignupForm } from "@/components/features/auth/signup-form";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Sign Up | ${process.env.NEXT_PUBLIC_APP_NAME}`,
    description: `Sign up to ${process.env.NEXT_PUBLIC_APP_NAME}`,
  };
}

export default function SignupPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <Suspense
          fallback={
            <div className="flex items-center justify-center">
              <Loader2 className="animate-spin" />
            </div>
          }
        >
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
