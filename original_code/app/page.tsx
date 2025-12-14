"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, Upload, CheckCircle, Languages } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useTranslation } from "@/lib/translations"
import { LanguageSelector } from "@/components/language-selector"

export default function HomePage() {
  const { language, setLanguage } = useLanguage()
  const t = useTranslation(language)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="container mx-auto px-4 py-4 flex justify-end">
        <LanguageSelector currentLanguage={language} onLanguageChange={setLanguage} />
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <h1 className="text-5xl font-bold text-blue-900 text-balance">{t.smartFormFiller}</h1>
          <p className="text-xl text-slate-700 text-balance">
            {language === "en"
              ? "AI-Powered Form Filling Assistant for Indian Citizen Services"
              : t.manageFormSubmissions}
          </p>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto text-pretty">
            {language === "en"
              ? "Automatically fill government service forms by uploading your documents. Save time, reduce errors, and simplify your Seva Kendra experience."
              : t.uploadRequired}
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/auth/sign-up">{language === "en" ? "Get Started" : t.newForm}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 bg-transparent">
              <Link href="/auth/login">{language === "en" ? "Login" : t.logout}</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 max-w-6xl mx-auto">
          <Card className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg">{t.uploadDocuments}</h3>
            <p className="text-sm text-muted-foreground">
              {language === "en"
                ? "Upload Aadhaar, PAN, voter ID, or other documents in PDF or image format"
                : t.uploadRequired}
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg">
              {language === "en" ? "Auto-Fill Forms" : t.completeFormSubmission}
            </h3>
            <p className="text-sm text-muted-foreground">
              {language === "en"
                ? "AI extracts key details and auto-maps them to the correct form fields"
                : t.extracting}
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-lg">{language === "en" ? "Review & Edit" : t.reviewExtractedData}</h3>
            <p className="text-sm text-muted-foreground">
              {language === "en"
                ? "Review extracted data and make any necessary corrections before submission"
                : t.pleaseReview}
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Languages className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-lg">{language === "en" ? "Multi-Language" : t.language}</h3>
            <p className="text-sm text-muted-foreground">
              {language === "en" ? "Support for multiple Indian languages and voice-based input" : t.voiceInput}
            </p>
          </Card>
        </div>

        {/* Supported Forms */}
        <div className="mt-16 text-center max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">
            {language === "en" ? "Supported Forms" : t.selectForm}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { en: "Aadhaar Update", key: "aadhaar" },
              { en: "Passport Application", key: "passport" },
              { en: "Driving License", key: "driving" },
              { en: "PAN Registration", key: "pan" },
              { en: "Visa Application", key: "visa" },
            ].map((form) => (
              <Card key={form.key} className="p-4 hover:shadow-lg transition-shadow">
                <p className="font-medium text-slate-800">{form.en}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
