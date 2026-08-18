import { redirect } from "next/navigation";

export default function LegacyEmailPage() {
  redirect("/dashboard/campaigns/email");
}
