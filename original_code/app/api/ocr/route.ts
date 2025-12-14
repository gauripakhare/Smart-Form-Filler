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

    const { fileUrl, documentId } = await request.json()

    if (!fileUrl) {
      return NextResponse.json({ error: "File URL required" }, { status: 400 })
    }

    const formData = new FormData()
    formData.append("url", fileUrl)
    formData.append("language", "eng")
    formData.append("isOverlayRequired", "false")
    formData.append("detectOrientation", "true")
    formData.append("scale", "true")
    formData.append("OCREngine", "2") // Engine 2 supports handwritten text
    formData.append("isTable", "true") // Better table/form detection

    const ocrResponse = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        apikey: process.env.OCR_SPACE_API_KEY || "helloworld",
      },
      body: formData,
    })

    const ocrResult = await ocrResponse.json()

    if (ocrResult.IsErroredOnProcessing) {
      console.error("[AI-form-filler] OCR error:", ocrResult.ErrorMessage)
      return NextResponse.json(
        {
          error: "OCR processing failed",
          details: ocrResult.ErrorMessage,
        },
        { status: 500 },
      )
    }

    const extractedText = ocrResult.ParsedResults?.[0]?.ParsedText || ""

    console.log("[AI-form-filler] OCR completed. Text length:", extractedText.length)

    // Update document with extracted text
    if (documentId) {
      await supabase.from("documents").update({ extracted_text: extractedText }).eq("id", documentId)
    }

    return NextResponse.json({
      success: true,
      extractedText,
      confidence: ocrResult.ParsedResults?.[0]?.FileParseExitCode === 1 ? "high" : "medium",
    })
  } catch (error) {
    console.error("[AI-form-filler] OCR error:", error)
    return NextResponse.json({ error: "OCR failed" }, { status: 500 })
  }
}
