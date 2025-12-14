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

    const { documentType } = await request.json()

    const token = request.cookies.get("digilocker_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Not connected to DigiLocker. Please authenticate first." }, { status: 401 })
    }

    const hasProductionCredentials = process.env.DIGILOCKER_CLIENT_ID && process.env.DIGILOCKER_CLIENT_SECRET

    if (!hasProductionCredentials) {
      // Return mock data for development/testing
      return NextResponse.json({
        success: true,
        message: "DigiLocker integration is ready for production API keys",
        documentType,
        mockData: {
          aadhaarNumber: "1234-5678-9012",
          fullName: "Sample User Name",
          dateOfBirth: "1990-01-01",
          gender: "Male",
          address: "Sample Address, City, State - 123456",
          state: "Sample State",
          postalCode: "123456",
          mobileNumber: "9876543210",
        },
        note: "Add DIGILOCKER_CLIENT_ID and DIGILOCKER_CLIENT_SECRET environment variables to enable live integration",
      })
    }

    try {
      const digiLockerResponse = await fetch(
        `https://digilocker.meripehchaan.gov.in/public/oauth2/1/file/${documentType}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (!digiLockerResponse.ok) {
        throw new Error("Failed to fetch from DigiLocker")
      }

      const documentData = await digiLockerResponse.json()

      return NextResponse.json({
        success: true,
        data: documentData,
        source: "digilocker",
      })
    } catch (digiLockerError) {
      console.error("[AI-form-filler] DigiLocker API error:", digiLockerError)
      return NextResponse.json({ error: "Failed to fetch from DigiLocker API" }, { status: 500 })
    }
  } catch (error) {
    console.error("[AI-form-filler] DigiLocker fetch error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch from DigiLocker",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
