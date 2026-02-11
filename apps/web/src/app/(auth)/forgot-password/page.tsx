import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/features/auth/forgot-password-form";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Forgot Password | ${process.env.NEXT_PUBLIC_APP_NAME}`,
  };
}

export default function ForgotPasswordPage() {
  return (
    <section className="h-screen flex flex-col items-center justify-center md:p-10 max-h-screen bg-gradient-to-br from-primary/50 to-background">
      <div className="w-full max-w-sm md:max-w-3xl">
        <Suspense
          fallback={
            <div className="flex items-center justify-center">
              <Loader2 className="animate-spin" />
            </div>
          }
        >
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </section>
  );
}
