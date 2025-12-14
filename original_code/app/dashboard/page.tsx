import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardClient } from "@/components/dashboard-client"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch user's form submissions
  const { data: submissions } = await supabase
    .from("form_submissions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  return <DashboardClient user={user} submissions={submissions || []} handleSignOut={handleSignOut} />
}
