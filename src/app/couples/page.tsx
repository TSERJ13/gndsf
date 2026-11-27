import { redirect } from "next/navigation";

// Couples now live under /athletes as a tab.
export default function CouplesPage() {
  redirect("/athletes?tab=couples");
}
