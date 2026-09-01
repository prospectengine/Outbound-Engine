import { Suspense } from "react";
import { SignupForm } from "@/components/auth/signup-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account — Outbound Engine",
  description: "Create an account to start using Outbound Engine.",
};

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 h-96 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-zinc-500 border-t-zinc-200 rounded-full animate-spin" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
