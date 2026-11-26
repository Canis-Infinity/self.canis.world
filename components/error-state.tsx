"use client";
import Link from "next/link";
import { Leaf, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
export function ErrorState({
  code,
  title,
  description,
  retry,
}: {
  code: string;
  title: string;
  description: string;
  retry?: () => void;
}) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6 text-foreground">
      <div className="max-w-md space-y-6 text-center">
        <Leaf className="mx-auto size-10" />
        <p className="text-sm font-medium tracking-widest text-muted-foreground">
          SELF / {code}
        </p>
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="leading-relaxed text-muted-foreground">{description}</p>
        <div className="flex justify-center gap-3">
          {retry && (
            <Button onClick={retry}>
              <RefreshCw />
              再試一次
            </Button>
          )}
          <Button variant="outline" render={<Link href="/" />}>
            <Home />
            回到總覽
          </Button>
        </div>
      </div>
    </main>
  );
}
