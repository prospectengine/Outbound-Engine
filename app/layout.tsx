import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased bg-slate-50 text-zinc-950">
        {children}
      </body>
    </html>
  );
}
