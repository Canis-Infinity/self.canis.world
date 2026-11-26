import { SelfApp } from "@/components/self-app";
export const metadata = { title: "回診摘要" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const valid =
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(new Date(date).getTime());
  return <SelfApp view="report" reportDate={valid ? date : undefined} />;
}
