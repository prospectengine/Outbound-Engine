import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-zinc-800/30 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-950 font-bold text-base tracking-tight shadow-md">
              OE
            </div>
            <span className="text-xl font-semibold text-white tracking-tight">
              Outbound Engine
            </span>
          </Link>
          <p className="text-xs text-zinc-400 font-medium">
            Research-Driven B2B Cold Outreach Framework
          </p>
        </div>

        {/* Auth Content Card */}
        {children}
      </div>
    </div>
  );
}
