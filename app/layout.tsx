import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";

export const metadata: Metadata = {
  title: "Outbound Engine — Research-Driven B2B Outbound",
  description:
    "An open-source, human-in-the-loop framework for research-driven, buyer-centric B2B cold email sequences.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased flex h-screen overflow-hidden bg-slate-50 text-zinc-950">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
