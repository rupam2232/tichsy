import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import type { Metadata } from "next";
import { SigninForm } from "@/components/features/auth/signin-form";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Sign In - Tichsy`,
    description: `Sign in to Tichsy`,
  };
}

export default function SigninPage() {
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
          <SigninForm />
        </Suspense>
      </div>
    </div>
  );
}
