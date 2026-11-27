import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <main
      className="flex min-h-svh items-center justify-center p-6"
      aria-label="載入註冊表單"
    >
      <div className="w-full max-w-sm space-y-6">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-9 w-52" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-full" />
      </div>
    </main>
  );
}
