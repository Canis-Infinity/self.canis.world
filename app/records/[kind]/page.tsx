import { notFound } from "next/navigation";
import { SelfApp } from "@/components/self-app";
import { categories, type Kind } from "@/lib/records";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ kind: string }>;
}) {
  const { kind } = await params;
  return { title: categories[kind as Kind]?.label || "紀錄" };
}
export default async function Page({
  params,
}: {
  params: Promise<{ kind: string }>;
}) {
  const { kind } = await params;
  if (!Object.hasOwn(categories, kind) || kind === "appointment") notFound();
  return <SelfApp view={kind as Kind} />;
}
