"use client";
import { ErrorState } from "@/components/error-state";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      code="500"
      title="暫時遇到一點狀況"
      description="目前無法顯示這個頁面，請稍後再試。"
      retry={reset}
    />
  );
}
