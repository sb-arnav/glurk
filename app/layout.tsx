import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = DM_Sans({ variable: "--font-sans", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Glurk Protocol",
  description: "The identity protocol for the internet. Apps trade data. Users own everything.",
  icons: { icon: "/glurk.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} dark`}>
      <body className="min-h-screen bg-[#0A0818] text-white font-[family-name:var(--font-sans)]">
        {children}
      </body>
    </html>
  );
}
