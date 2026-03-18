import type { Metadata } from "next";
import ClientPage from "./clientPage";

export const metadata: Metadata = {
  title: "Home - Tichsy",
  description: "Home page of Tichsy. Create or Manage your restaurant.",
};

export default async function page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const from = params.from;
  return <ClientPage from={from} />;
}
