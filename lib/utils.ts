import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return dateString;
  }
}

export function getSafeRedirectUrl(
  url: string | null | undefined,
  defaultUrl: string = "/"
): string {
  if (!url) return defaultUrl;
  const trimmed = url.trim();

  // Reject protocol-relative URLs (e.g. //evil.com), backslashes, and schemes
  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !trimmed.startsWith("/\\") &&
    !trimmed.includes("\\")
  ) {
    try {
      const parsed = new URL(trimmed, "http://localhost");
      if (parsed.origin === "http://localhost") {
        return parsed.pathname + parsed.search + parsed.hash;
      }
    } catch {
      return defaultUrl;
    }
  }
  return defaultUrl;
}
