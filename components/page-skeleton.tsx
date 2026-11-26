"use client";
import { usePathname } from "next/navigation";
import { ContentSkeleton, type SkeletonView } from "./content-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
export function PageSkeleton() {
  const pathname = usePathname();
  if (pathname === "/login")
    return (
      <div
        role="status"
        aria-label="正在載入登入頁"
        aria-busy="true"
        className="grid min-h-svh lg:grid-cols-2"
      >
        <div className="hidden bg-primary/15 p-16 lg:flex lg:flex-col lg:justify-between">
          <Skeleton className="h-10 w-28" />
          <div className="space-y-6">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-16 w-4/5" />
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="h-6 w-full" />
          </div>
          <Skeleton className="h-5 w-56" />
        </div>
        <div className="flex items-center justify-center p-8">
          <div className="w-full max-w-sm space-y-7">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-56" />
            {[0, 1].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-5 w-60" />
          </div>
        </div>
      </div>
    );
  const kind = pathname.split("/")[2];
  const view: SkeletonView =
    pathname === "/calendar"
      ? "appointment"
      : pathname === "/report"
        ? "report"
        : ["mood", "sleep", "body", "medication", "reflection"].includes(kind)
          ? (kind as SkeletonView)
          : "dashboard";
  return (
    <div
      className={`mx-auto w-full space-y-7 px-4 py-6 sm:px-6 ${view === "appointment" ? "max-w-none" : "max-w-6xl"}`}
    >
      <ContentSkeleton view={view} heading />
    </div>
  );
}
