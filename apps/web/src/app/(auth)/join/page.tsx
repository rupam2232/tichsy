import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import type { Metadata } from "next";
import { JoinForm } from "@/components/features/auth/join-form";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Join - Tichsy`,
    description: `Join a restaurant on Tichsy`,
  };
}

export default function JoinPage() {
  return (
    <section className="flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
          }
        >
          <JoinForm />
        </Suspense>
      </div>
    </section>
  );
}
