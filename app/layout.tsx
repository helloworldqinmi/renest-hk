import type { Metadata } from "next";
import "./globals.css";
import { DemoProvider } from "@/components/state-provider";
import { AppHeader } from "@/components/common/app-header";

export const metadata: Metadata = {
  title: "ReSpace HK | Move what matters",
  description: "AI-powered furniture migration and space planning for compact Hong Kong homes.",
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
