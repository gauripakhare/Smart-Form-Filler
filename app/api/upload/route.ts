import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const documentType = formData.get("documentType") as string
    const formSubmissionId = formData.get("formSubmissionId") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!documentType) {
      return NextResponse.json({ error: "Document type required" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    })

    // Save document info to database
    const { data: document, error: dbError } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        form_submission_id: formSubmissionId,
        document_type: documentType,
        file_url: blob.url,
        file_name: file.name,
        file_size: file.size,
      })
      .select()
      .single()

    if (dbError) {
      console.error("[AI-form-filler] Database error:", dbError)
      return NextResponse.json({ error: "Failed to save document" }, { status: 500 })
    }

    return NextResponse.json({
      id: document.id,
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
      documentType,
    })
  } catch (error) {
    console.error("[AI-form-filler] Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
