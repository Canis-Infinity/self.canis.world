import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
export const metadata: Metadata = {
  metadataBase: new URL("https://self.canis.world"),
  title: { default: "Self｜日常狀態與回診紀錄", template: "%s｜Self" },
  description:
    "屬於自己的私人紀錄空間，整理情緒、睡眠、身體數據、用藥與自我反思，讓每次回診更從容。",
  applicationName: "Self",
  manifest: "/manifest.webmanifest",
  robots: { index: false, follow: false, nocache: true },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: "https://self.canis.world",
    title: "Self｜日常狀態與回診紀錄",
    description: "記住日常的小變化，讓回診更從容。",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Self｜日常狀態與回診紀錄",
    images: ["/opengraph-image"],
  },
  appleWebApp: { capable: true, title: "Self", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="zh-Hant"
      suppressHydrationWarning
      className={cn("font-sans", inter.variable)}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
