import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <main
      id="main"
      className="mx-auto w-full max-w-5xl p-6"
      aria-label="載入使用者管理"
      aria-busy="true"
    >
      <div className="mb-5 flex justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="mb-5 grid grid-cols-4 gap-2 border-y py-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>
      <div className="mb-4 flex gap-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="divide-y border-y">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between gap-3 py-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </main>
  );
}
