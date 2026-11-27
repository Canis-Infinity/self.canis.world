import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <main
      id="main"
      className="mx-auto w-full max-w-5xl space-y-6 p-6"
      aria-label="載入帳號審核"
    >
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-5 w-72" />
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
    </main>
  );
}
