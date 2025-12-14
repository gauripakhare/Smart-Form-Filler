import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: submission, error } = await supabase
      .from("form_submissions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    return NextResponse.json(submission)
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Failed to fetch submission" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const { data: submission, error } = await supabase
      .from("form_submissions")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Update error:", error)
      return NextResponse.json({ error: "Failed to update submission" }, { status: 500 })
    }

    return NextResponse.json(submission)
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Failed to update submission" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete the submission (only if it belongs to the user)
    const { error } = await supabase.from("form_submissions").delete().eq("id", id).eq("user_id", user.id)

    if (error) {
      console.error("Delete error:", error)
      return NextResponse.json({ error: "Failed to delete submission" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Form deleted successfully" })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Failed to delete submission" }, { status: 500 })
  }
}
