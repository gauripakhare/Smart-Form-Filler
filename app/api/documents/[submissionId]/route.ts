import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: submission, error: submissionError } = await supabase
      .from("form_submissions")
      .select("id, user_id")
      .eq("id", submissionId)
      .eq("user_id", user.id)
      .single()

    if (submissionError || !submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    const { data: documents, error } = await supabase
      .from("documents")
      .select("*")
      .eq("form_submission_id", submissionId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[AI-form-filler] Database error:", error)
      return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
    }

    return NextResponse.json(documents || [])
  } catch (error) {
    console.error("[AI-form-filler] Fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}
