import { redirect } from "next/navigation";
import { getFirstRegistryItem } from "@/registry/registry";

export default function HomePage() {
  redirect(`/components/${getFirstRegistryItem().id}`);
}
