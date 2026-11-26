"use client";
import "./globals.css";
import { ErrorState } from "@/components/error-state";
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="zh-Hant">
      <body>
        <ErrorState
          code="500"
          title="暫時遇到一點狀況"
          description="頁面無法載入，請稍後重新嘗試。"
          retry={reset}
        />
      </body>
    </html>
  );
}
