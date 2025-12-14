import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { formType, status } = await request.json()

    const { data: submission, error } = await supabase
      .from("form_submissions")
      .insert({
        user_id: user.id,
        form_type: formType,
        status: status || "draft",
        form_data: {},
        extracted_data: {},
      })
      .select()
      .single()

    if (error) {
      console.error("[AI-form-filler] Database error:", error)
      return NextResponse.json({ error: "Failed to create submission" }, { status: 500 })
    }

    return NextResponse.json(submission)
  } catch (error) {
    console.error("[AI-form-filler] Error:", error)
    return NextResponse.json({ error: "Failed to create submission" }, { status: 500 })
  }
}
