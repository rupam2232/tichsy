import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/forgot-password-form";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Forgot Password | ${process.env.NEXT_PUBLIC_APP_NAME}`,
  };
}

export default function ForgotPasswordPage() {
  return (
    <section className="flex flex-col items-center justify-center md:p-10 max-h-screen bg-gradient-to-br from-primary/50 to-background">
      <div className="w-full max-w-sm md:max-w-3xl">
        <ForgotPasswordForm />
      </div>
    </section>
  )
}