import { kinds } from "@/lib/records";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
export type SkeletonView =
  | "dashboard"
  | "report"
  | "appointment"
  | "mood"
  | "sleep"
  | "body"
  | "medication"
  | "reflection"
  | "diet";
export function ContentSkeleton({
  view = "dashboard",
  heading = false,
}: {
  view?: SkeletonView;
  heading?: boolean;
}) {
  return (
    <div
      className="w-full space-y-6"
      role="status"
      aria-label="正在讀取內容"
      aria-busy="true"
    >
      <span className="sr-only">正在讀取內容</span>
      {heading && view !== "appointment" && (
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-9 w-56" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
      )}
      {heading && view !== "appointment" && <FilterSkeleton />}
      {view === "appointment" ? (
        <div className="overflow-hidden rounded-xl border">
          <div className="flex items-center justify-between p-6">
            <div className="flex gap-3">
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-48" />
            </div>
            <Skeleton className="h-9 w-28" />
          </div>
          <div className="grid grid-cols-7 border-t">
            {Array.from({ length: 7 }, (_, i) => (
              <div className="flex justify-center border-b p-4" key={i}>
                <Skeleton className="h-4 w-8" />
              </div>
            ))}
            {Array.from({ length: 35 }, (_, i) => (
              <div
                key={i}
                className="h-36 space-y-4 border-r border-b p-3 sm:h-44 xl:h-48"
              >
                <Skeleton className="h-6 w-6 rounded-full" />
                {i % 4 === 0 && <Skeleton className="h-7 w-full" />}
              </div>
            ))}
          </div>
        </div>
      ) : view === "report" ? (
        <ReportSkeleton />
      ) : view !== "dashboard" ? (
        <RecordListSkeleton kind={view} />
      ) : (
        <>
          <StatsSkeleton />
          <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-36" />
                <Skeleton className="mt-2 h-4 w-52" />
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
                <Skeleton className="h-64 w-full" />
                <div className="flex justify-center gap-4">
                  {Array.from({ length: 4 }, (_, i) => (
                    <Skeleton key={i} className="h-4 w-12" />
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-5">
                <Skeleton className="h-7 w-44" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-9 w-36" />
              </CardContent>
            </Card>
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <RecordSkeleton kind="mood" />
          <RecordSkeleton kind="diet" />
          <PaginationSkeleton />
        </>
      )}
    </div>
  );
}

function FilterSkeleton() {
  return (
    <div className="grid items-end gap-4 rounded-xl border p-4 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-9 w-full" />
      </div>
      <Skeleton className="h-9 w-full" />
    </div>
  );
}
function RecordListSkeleton({
  kind,
}: {
  kind: Exclude<SkeletonView, "dashboard" | "report" | "appointment">;
}) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-24" />
      {[0, 1, 2].map((i) => (
        <RecordSkeleton key={i} kind={kind} />
      ))}
      <PaginationSkeleton />
    </div>
  );
}
function RecordSkeleton({ kind }: { kind: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="size-8" />
            <Skeleton className="size-8" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {kind === "mood" && (
          <>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </>
        )}
        {kind === "sleep" && (
          <>
            <Skeleton className="h-7 w-36" />
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-4 w-2/3" />
          </>
        )}
        {kind === "body" && (
          <>
            <div className="flex items-end gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-4 w-1/2" />
          </>
        )}
        {kind === "medication" && (
          <>
            <div className="flex gap-3">
              <Skeleton className="h-6 w-14 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </>
        )}
        {kind === "diet" && (
          <>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-24 rounded-lg" />
          </>
        )}
        {kind === "reflection" && (
          <div className="space-y-3">
            {["w-full", "w-5/6", "w-full", "w-2/3"].map((width, i) => (
              <Skeleton key={i} className={`h-4 ${width}`} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
function ReportSkeleton() {
  return (
    <div className="space-y-6">
      <StatsSkeleton />
      <Skeleton className="h-4 w-3/4" />
      {kinds
        .filter((kind) => kind !== "appointment")
        .map((kind) => (
          <section key={kind} className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-4 w-12" />
            </div>
            <RecordSkeleton kind={kind} />
          </section>
        ))}
      <PaginationSkeleton />
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 shrink-0" />
              <Skeleton className="h-4 w-24" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-4 w-36 max-w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
function PaginationSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 lg:flex-row lg:flex-wrap lg:justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-9 w-20" />
      </div>
      <Skeleton className="h-4 w-40" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="size-9" />
        <Skeleton className="size-9" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
  );
}
