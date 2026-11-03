import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "typostore | MLBB Top Up",
  description: "Platform top up Mobile Legends dengan checkout aman dan admin dashboard.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
