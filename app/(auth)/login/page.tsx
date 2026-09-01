import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — Outbound Engine",
  description: "Sign in to access your Outbound Engine workspace.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 h-80 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-zinc-500 border-t-zinc-200 rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
