import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./motion.css";
import { LocaleProvider } from "@/components/locale-provider";
import { AppHeader } from "@/components/common/app-header";

const sans = localFont({ src: "./fonts/geist-sans.woff2", variable: "--font-geist-sans", display: "swap" });
const mono = localFont({ src: "./fonts/geist-mono.woff2", variable: "--font-geist-mono", display: "swap", preload: false });
const editorial = localFont({ src: [
  { path: "./fonts/newsreader.ttf", weight: "400", style: "normal" },
  { path: "./fonts/newsreader-italic.ttf", weight: "400", style: "italic" },
], variable: "--font-editorial", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://renest-hk.vercel.app"),
  title: "ReNest — The Moving Studio",
  description: "Explore furniture reuse, compare 3D layouts and prepare a moving plan for compact Hong Kong homes. An interactive prototype with a bundled example apartment.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "ReNest — The Moving Studio",
    description: "Explore furniture reuse, compare 3D layouts and prepare a moving plan for compact Hong Kong homes. An interactive prototype with a bundled example apartment.",
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
        <LocaleProvider>
          <AppHeader />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
