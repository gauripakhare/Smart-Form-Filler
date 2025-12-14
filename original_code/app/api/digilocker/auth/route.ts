import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const clientId = process.env.DIGILOCKER_CLIENT_ID
  const redirectUri = process.env.DIGILOCKER_REDIRECT_URI || `${request.nextUrl.origin}/api/digilocker/callback`

  if (!clientId) {
    return NextResponse.json(
      { error: "DigiLocker is not configured. Please add DIGILOCKER_CLIENT_ID environment variable." },
      { status: 500 },
    )
  }

  const authUrl = new URL("https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize")
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("client_id", clientId)
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("state", crypto.randomUUID())

  return NextResponse.redirect(authUrl.toString())
}
