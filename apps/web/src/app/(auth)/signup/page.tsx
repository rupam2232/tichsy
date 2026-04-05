import type { Metadata } from "next";
import { SignupForm } from "@/components/features/auth/signup-form";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Sign Up - Tichsy`,
    description: `Sign up to Tichsy`,
  };
}

export default function SignupPage() {
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
          <SignupForm />
        </Suspense>
      </div>
    </section>
  );
}
