import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HabitDashboard from "@/components/HabitDashboard";

export default async function HabitPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <HabitDashboard userId={user.id} />;
}
