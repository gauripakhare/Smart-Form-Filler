import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createApiSetuClient, getMockVerificationData } from "@/lib/api-setu/client"

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

    const { documentType, documentNumber, consent } = await request.json()

    if (!documentType || !documentNumber) {
      return NextResponse.json(
        { error: "Document type and number are required" },
        { status: 400 }
      )
    }

    if (!consent) {
      return NextResponse.json(
        { error: "User consent is required for document verification" },
        { status: 400 }
      )
    }

    const apiSetuClient = createApiSetuClient()

    if (!apiSetuClient) {
      const mockData = getMockVerificationData(documentType)
      return NextResponse.json({
        ...mockData,
        mode: "demo",
      })
    }

    if (documentType.toLowerCase() === "aadhaar") {
      return NextResponse.json(
        {
          error: "Aadhaar verification not supported via this endpoint",
          message: "Aadhaar e-KYC on API Setu still uses DigiLocker. Please use /api/digilocker endpoints for Aadhaar verification.",
          redirect: "/api/digilocker/auth",
        },
        { status: 400 }
      )
    }

    if (documentType.toLowerCase() === "pan") {
      const result = await apiSetuClient.verifyPAN({
        panNumber: documentNumber,
        consent,
      })

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "PAN verification failed" },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        data: result.data,
        source: "api_setu_demo",
      })
    }

    return NextResponse.json(
      {
        error: `Document type '${documentType}' not supported`,
        supported: ["pan"],
        note: "This is a demo implementation. Production requires API Setu registration and service-specific configuration.",
      },
      { status: 400 }
    )
  } catch (error) {
    console.error("[AI-form-filler] API Setu verification error:", error)
    return NextResponse.json(
      {
        error: "Verification failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
