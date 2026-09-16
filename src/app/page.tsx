import { redirect } from "next/navigation";
import { isLang } from "@/lib/lang";

export default function RootPage() {
  redirect("/fr");
}

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata() {
  return { title: "Souk.dz" };
}

// Keep TS happy about unused var
void isLang;