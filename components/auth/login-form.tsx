"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, type AuthActionResult } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Lock, Mail, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const urlError = searchParams.get("error");

  const [state, formAction, isPending] = useActionState<
    AuthActionResult | null,
    FormData
  >(signIn, null);

  const errorMessage =
    state?.error ||
    (urlError === "auth_callback_failed"
      ? "Authentication callback failed. Please try signing in again."
      : null);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white tracking-tight">
          Sign in to your account
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Enter your credentials to access your outbound workspace.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-start space-x-2.5 text-rose-400 text-xs animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />

        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-medium text-zinc-300"
          >
            Work Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="operator@company.com"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-xs font-medium text-zinc-300"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-colors"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-zinc-100 text-zinc-950 hover:bg-white hover:text-black font-semibold text-xs h-9 mt-2 transition-all shadow-md group"
        >
          {isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-zinc-800/80 text-center">
        <p className="text-xs text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link
            href={next !== "/" ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
            className="text-zinc-200 font-medium hover:text-white underline underline-offset-4 transition-colors"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
