import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono, Noto_Sans_Devanagari } from "next/font/google";
import { ServiceWorker } from "../components/pwa/ServiceWorker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const devanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  weight: ["600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Saath",
  description:
    "Shared autos from a Pune Metro exit, with a fair split of the legal fare.",
  applicationName: "Saath",
  appleWebApp: { capable: true, title: "Saath", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#ffd60a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${devanagari.variable}`}>
      <body>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
