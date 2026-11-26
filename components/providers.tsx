"use client";
import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "./app-shell";
export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production")
      navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <NextTopLoader color="#737373" showSpinner={false} />
      <Toaster>
        <TooltipProvider>
          <AppShell>{children}</AppShell>
        </TooltipProvider>
      </Toaster>
    </ThemeProvider>
  );
}
