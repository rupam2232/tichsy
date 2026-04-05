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
    <section className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-br from-primary/70 to-background">
      <div className="w-full max-w-md">
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
    </section>
  );
}
