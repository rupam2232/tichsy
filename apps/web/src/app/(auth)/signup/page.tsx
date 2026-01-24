import type { Metadata } from "next";
import { SignupForm } from "@/components/signup-form";

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
        <SignupForm />
      </div>
    </div>
  )
}
