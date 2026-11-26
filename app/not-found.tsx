import { ErrorState } from "@/components/error-state";
export default function NotFound() {
  return (
    <ErrorState
      code="404"
      title="這一頁暫時找不到"
      description="網址可能已變更，回到你的空間繼續記錄吧。"
    />
  );
}
