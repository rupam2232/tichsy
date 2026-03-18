import type { Metadata } from "next";
import ClientPage from "./clientPage";

export const metadata: Metadata = {
  title: "Checkout - Tichsy",
  description: "Checkout for your subscription.",
};

export default async function page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const plan = params.plan as string;
  const period = params.period as string;
  return <ClientPage searchParams={{ plan, period }} />;
}
