import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NamazDashboard from "@/components/NamazDashboard";

export default async function NamazPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <NamazDashboard userId={user.id} />;
}
