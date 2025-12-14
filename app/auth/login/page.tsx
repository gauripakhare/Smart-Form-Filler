"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useLanguage } from "@/lib/language-context"
import { useTranslation } from "@/lib/translations"
import { LanguageSelector } from "@/components/language-selector"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { language, setLanguage } = useLanguage()
  const t = useTranslation(language)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        throw signInError
      }

      if (data?.user) {
        window.location.href = "/dashboard"
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex justify-end">
            <LanguageSelector currentLanguage={language} onLanguageChange={setLanguage} />
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-blue-900">{t.smartFormFiller}</h1>
            <p className="text-sm text-slate-600 mt-2">
              {language === "en" ? "AI-Powered Form Filling for Indian Government Services" : t.aiDescription}
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{language === "en" ? "Login" : "लॉगिन"}</CardTitle>
              <CardDescription>
                {language === "en"
                  ? "Enter your email below to login to your account"
                  : "अपनी खाता में लॉगिन करने के लिए अपनी ईमेल दर्ज करें"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">{t.email || "Email"}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">{language === "en" ? "Password" : "पासवर्ड"}</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {error && (
                    <div className="rounded-md bg-red-50 border border-red-200 p-3">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? t.submitting : t.submit}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  {language === "en" ? "Don't have an account? " : "खाता नहीं है? "}
                  <Link href="/auth/sign-up" className="underline underline-offset-4">
                    {language === "en" ? "Sign up" : "साइन अप करें"}
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
