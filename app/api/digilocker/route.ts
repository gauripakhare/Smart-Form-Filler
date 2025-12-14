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

    const { docType, aadhaarNumber } = await request.json()

    return NextResponse.json({
      success: false,
      message: "DigiLocker integration has been replaced with API Setu",
      note: "Please use /api/api-setu/verify endpoint for document verification",
      migration: {
        oldEndpoint: "/api/digilocker",
        newEndpoint: "/api/api-setu/verify",
        documentation: "https://apisetu.gov.in",
      },
    })
  } catch (error) {
    console.error("[AI-form-filler] DigiLocker error:", error)
    return NextResponse.json({ error: "DigiLocker has been deprecated" }, { status: 500 })
  }
}
