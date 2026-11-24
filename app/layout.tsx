import type { Metadata, Viewport } from "next";
import "@fontsource/spectral/400.css";
import "@fontsource/spectral/400-italic.css";
import "@fontsource/spectral/500.css";
import "@fontsource/spectral/600.css";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

// Fonts are self-hosted from npm (@fontsource), so builds need no network access.

export const metadata: Metadata = {
  title: "A Z Hasnain Kabir",
  description:
    "ML systems and AI infrastructure engineer: LLM inference and serving, request scheduling, batching and KV-cache management.",
  openGraph: {
    title: "A Z Hasnain Kabir",
    description: "ML systems and AI infrastructure engineer working on LLM inference and serving.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
