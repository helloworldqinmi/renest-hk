import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { DemoProvider } from "@/components/state-provider";
import { AppHeader } from "@/components/common/app-header";

const sans = localFont({ src: "./fonts/geist-sans.woff2", variable: "--font-geist-sans", display: "swap" });
const mono = localFont({ src: "./fonts/geist-mono.woff2", variable: "--font-geist-mono", display: "swap", preload: false });
const editorial = localFont({ src: [
  { path: "./fonts/newsreader.ttf", weight: "400", style: "normal" },
  { path: "./fonts/newsreader-italic.ttf", weight: "400", style: "italic" },
], variable: "--font-editorial", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.cyberironman.com"),
  title: "ReNest — The Moving Studio",
  description: "Scan your old home and new home. ReNest helps you reuse existing furniture, optimize compact spaces, and buy only what actually fits.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "ReNest — The Moving Studio",
    description: "Scan your old home and new home. ReNest helps you reuse existing furniture, optimize compact spaces, and buy only what actually fits.",
    url: "/",
    siteName: "ReNest",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "ReNest HK furniture migration from old home to new home" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${sans.variable} ${mono.variable} ${editorial.variable}`}>
      <body>
        <DemoProvider>
          <AppHeader />
          {children}
        </DemoProvider>
      </body>
    </html>
  );
}
