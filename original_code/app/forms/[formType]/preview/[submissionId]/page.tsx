"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Download, Send } from "lucide-react"
import Link from "next/link"
import { LanguageSelector } from "@/components/language-selector"
import { useTranslation } from "@/lib/translations"
import { useLanguage } from "@/lib/language-context"

export default function PreviewPage() {
  const params = useParams()
  const router = useRouter()
  const formType = params?.formType as string
  const submissionId = params?.submissionId as string
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})

  const { language, setLanguage } = useLanguage()
  const t = useTranslation(language)

  useEffect(() => {
    fetchSubmissionData()
  }, [submissionId])

  const fetchSubmissionData = async () => {
    try {
      const response = await fetch(`/api/form-submissions/${submissionId}`)
      if (!response.ok) throw new Error("Failed to fetch")

      const submission = await response.json()
      setFormData(submission.form_data || {})
    } catch (err) {
      console.error("[AI-form-filler] Fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = () => {
    window.open(`/api/generate-pdf/${submissionId}`, "_blank")
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const response = await fetch(`/api/form-submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "submitted",
          submitted_at: new Date().toISOString(),
        }),
      })

      if (!response.ok) throw new Error("Failed to submit")

      router.push(`/forms/${formType}/success/${submissionId}`)
    } catch (err) {
      console.error("[AI-form-filler] Submit error:", err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const groupedData: Record<string, Record<string, any>> = {
    "Personal Information": {},
    "Contact Information": {},
    "Address Information": {},
    "Family Information": {},
    "Document Information": {},
    "Additional Information": {},
  }

  Object.entries(formData).forEach(([key, value]) => {
    if (!value) return

    if (key.includes("mobile") || key.includes("email") || key.includes("phone")) {
      groupedData["Contact Information"][key] = value
    } else if (key.includes("address") || key.includes("city") || key.includes("state") || key.includes("postal")) {
      groupedData["Address Information"][key] = value
    } else if (key.includes("father") || key.includes("mother") || key.includes("spouse")) {
      groupedData["Family Information"][key] = value
    } else if (key.includes("aadhaar") || key.includes("pan") || key.includes("passport")) {
      groupedData["Document Information"][key] = value
    } else if (
      key.includes("name") ||
      key.includes("dateOfBirth") ||
      key.includes("gender") ||
      key.includes("nationality")
    ) {
      groupedData["Personal Information"][key] = value
    } else {
      groupedData["Additional Information"][key] = value
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-6">
      <div className="container max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/forms/${formType}/fill/${submissionId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.back}
            </Link>
          </Button>
          <LanguageSelector currentLanguage={language} onLanguageChange={setLanguage} />
        </div>

        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            {language === "en" ? "Preview Form" : t.reviewExtractedData}
          </h1>
          <p className="text-slate-600 mt-2">
            {language === "en" ? "Review your form before submission" : t.pleaseReview}
          </p>
        </div>

        {Object.entries(groupedData).map(
          ([category, data]) =>
            Object.keys(data).length > 0 && (
              <Card key={category}>
                <CardHeader>
                  <CardTitle>{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(data).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <p className="text-sm font-medium text-slate-600">
                          {key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())
                            .trim()}
                        </p>
                        <p className="text-base text-slate-900">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ),
        )}

        <div className="flex justify-between">
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href={`/forms/${formType}/fill/${submissionId}`}>{t.back}</Link>
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              {language === "en" ? "Download PDF" : "PDF डाउनलोड करें"}
            </Button>
          </div>
          <Button size="lg" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t.submitting}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {t.submit}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
