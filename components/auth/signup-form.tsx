"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signUp, type AuthActionResult } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Lock, Mail, User, AlertCircle, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

export function SignupForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [state, formAction, isPending] = useActionState<
    AuthActionResult | null,
    FormData
  >(signUp, null);

  if (state?.success && state?.message) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-semibold text-white">Check your email</h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
            {state.message}
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center text-xs text-zinc-300 hover:text-white font-medium underline underline-offset-4"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white tracking-tight">
          Create your account
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Set up your operator identity to start managing outbound campaigns.
        </p>
      </div>

      {state?.error && (
        <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-start space-x-2.5 text-rose-400 text-xs animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />

        <div className="space-y-1.5">
          <label
            htmlFor="fullName"
            className="block text-xs font-medium text-zinc-300"
          >
            Full Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              placeholder="Syed Ahmed"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-colors"
            />
          </div>
        </div>

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
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="At least 6 characters"
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
              Creating account...
            </>
          ) : (
            <>
              Create Account
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-zinc-800/80 text-center">
        <p className="text-xs text-zinc-400">
          Already have an account?{" "}
          <Link
            href={next !== "/" ? `/login?next=${encodeURIComponent(next)}` : "/login"}
            className="text-zinc-200 font-medium hover:text-white underline underline-offset-4 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
