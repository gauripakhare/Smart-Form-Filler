import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FormSelectClient } from "@/components/form-select-client"

export default async function SelectFormPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  return <FormSelectClient />
}
