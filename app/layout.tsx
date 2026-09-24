import type { Metadata } from "next";
import "./globals.css";
import { DemoProvider } from "@/components/state-provider";
import { AppHeader } from "@/components/common/app-header";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.cyberironman.com"),
  title: "ReNest HK — Furniture Migration & Space Planning",
  description: "Scan your old home and new home. ReNest helps you reuse existing furniture, optimize compact spaces, and buy only what actually fits.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "ReNest HK — Furniture Migration & Space Planning",
    description: "Scan your old home and new home. ReNest helps you reuse existing furniture, optimize compact spaces, and buy only what actually fits.",
    url: "/",
    siteName: "ReNest HK",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "ReNest HK furniture migration from old home to new home" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <DemoProvider>
          <AppHeader />
          {children}
        </DemoProvider>
      </body>
    </html>
  );
}
