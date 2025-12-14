import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  if (!code) {
    return NextResponse.redirect(`${request.nextUrl.origin}/forms/select?error=digilocker_failed`)
  }

  const clientId = process.env.DIGILOCKER_CLIENT_ID
  const clientSecret = process.env.DIGILOCKER_CLIENT_SECRET
  const redirectUri = process.env.DIGILOCKER_REDIRECT_URI || `${request.nextUrl.origin}/api/digilocker/callback`

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${request.nextUrl.origin}/forms/select?error=digilocker_config`)
  }

  try {
    const tokenResponse = await fetch("https://digilocker.meripehchaan.gov.in/public/oauth2/1/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error("[AI-form-filler] DigiLocker token error:", tokenData)
      return NextResponse.redirect(`${request.nextUrl.origin}/forms/select?error=digilocker_token`)
    }

    // Store access token in session/cookie for later use
    const response = NextResponse.redirect(`${request.nextUrl.origin}/forms/select?digilocker=success`)
    response.cookies.set("digilocker_token", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600, // 1 hour
      sameSite: "lax",
    })

    return response
  } catch (error) {
    console.error("[AI-form-filler] DigiLocker callback error:", error)
    return NextResponse.redirect(`${request.nextUrl.origin}/forms/select?error=digilocker_failed`)
  }
}
