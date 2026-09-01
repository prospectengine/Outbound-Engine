"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/app/auth/actions";
import { LogOut, User as UserIcon, Loader2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center space-x-3 p-2 rounded-lg bg-zinc-800/40 border border-zinc-700/30 animate-pulse">
        <div className="w-8 h-8 rounded-full bg-zinc-700/60" />
        <div className="flex-1 space-y-1">
          <div className="h-3 bg-zinc-700/60 rounded w-20" />
          <div className="h-2.5 bg-zinc-700/40 rounded w-28" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const fullName = user.user_metadata?.full_name as string | undefined;
  const email = user.email;
  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : email
    ? email[0].toUpperCase()
    : "U";

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut();
    });
  };

  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-800/60 border border-zinc-700/40 text-xs">
      <div className="flex items-center space-x-2.5 min-w-0 pr-2">
        <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-[11px] font-semibold text-zinc-200 shrink-0">
          {initials || <UserIcon className="w-3.5 h-3.5" />}
        </div>
        <div className="min-w-0 flex-1">
          {fullName ? (
            <>
              <p className="font-semibold text-zinc-100 truncate text-[11px] leading-tight">
                {fullName}
              </p>
              <p className="text-[10px] text-zinc-400 truncate leading-tight mt-0.5">
                {email}
              </p>
            </>
          ) : (
            <p className="font-semibold text-zinc-100 truncate text-[11px]">
              {email}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={handleSignOut}
        disabled={isPending}
        title="Sign Out"
        className="text-zinc-400 hover:text-rose-400 p-1.5 rounded-md hover:bg-zinc-700/50 transition-colors disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <LogOut className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}
