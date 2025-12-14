import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  console.log("[AI-form-filler] Auth callback received, code:", code ? "Present" : "Missing")

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("[AI-form-filler] Error exchanging code for session:", error)
      return NextResponse.redirect(`${origin}/auth/error`)
    }

    console.log("[AI-form-filler] Successfully exchanged code for session")
    return NextResponse.redirect(`${origin}${next}`)
  }

  console.error("[AI-form-filler] No code provided in callback")
  return NextResponse.redirect(`${origin}/auth/error`)
}
