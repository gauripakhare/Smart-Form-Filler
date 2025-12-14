"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formTemplates } from "@/lib/form-templates"
import { DynamicFormField } from "@/components/dynamic-form-field"
import { useLanguage } from "@/lib/language-context"
import { languages, useTranslation } from "@/lib/translations"

interface FormData {
  fullName: string
  dateOfBirth: string
  gender: string
  aadhaarNumber: string
  panNumber: string
  address: string
  city: string
  state: string
  postalCode: string
  mobileNumber: string
  email: string
  fatherName: string
  motherName: string
}

export default function ReviewExtractedDataPage() {
  const params = useParams()
  const formType = params?.formType as string
  const submissionId = params?.submissionId as string
  const router = useRouter()
  const { language } = useLanguage()
  const t = useTranslation(language)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const voiceLanguage = languages.find((l) => l.code === language)?.voiceCode || "en-IN"

  const template = formTemplates[formType as keyof typeof formTemplates]

  useEffect(() => {
    fetchSubmissionData()
  }, [submissionId])

  const fetchSubmissionData = async () => {
    try {
      const response = await fetch(`/api/form-submissions/${submissionId}`)
      if (!response.ok) throw new Error("Failed to fetch submission")

      const submission = await response.json()
      setFormData(submission.extracted_data || {})
    } catch (err) {
      setError("Failed to load extracted data")
      console.error("[AI-form-filler] Fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleVoiceInput = (field: string, transcript: string) => {
    handleInputChange(field, transcript)
  }

  const handleSaveAndContinue = async () => {
    setSubmitting(true)
    try {
      const response = await fetch(`/api/form-submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form_data: formData,
          extracted_data: formData,
        }),
      })

      if (!response.ok) throw new Error("Failed to save data")

      router.push(`/forms/${formType}/fill/${submissionId}`)
    } catch (err) {
      setError("Failed to save data")
      console.error("[AI-form-filler] Save error:", err)
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

  const groupedFields: Record<string, typeof template.fields> = {}
  template.fields.forEach((field) => {
    const category =
      field.name.includes("father") ||
      field.name.includes("mother") ||
      field.name.includes("spouse") ||
      field.name.includes("guardian")
        ? "Family Information"
        : field.name.includes("address") ||
            field.name.includes("city") ||
            field.name.includes("state") ||
            field.name.includes("postal") ||
            field.name.includes("district") ||
            field.name.includes("village") ||
            field.name.includes("house")
          ? "Address Information"
          : field.name.includes("mobile") ||
              field.name.includes("email") ||
              field.name.includes("phone") ||
              field.name.includes("telephone") ||
              field.name.includes("contact")
            ? "Contact Information"
            : field.name.includes("aadhaar") ||
                field.name.includes("pan") ||
                field.name.includes("passport") ||
                field.name.includes("voter") ||
                field.name.includes("license")
              ? "Document Information"
              : field.name.includes("employment") ||
                  field.name.includes("employer") ||
                  field.name.includes("occupation") ||
                  field.name.includes("education")
                ? "Employment & Education"
                : field.name.includes("visa") || field.name.includes("nationality") || field.name.includes("citizen")
                  ? "Visa & Nationality"
                  : field.name.includes("vehicle") || field.name.includes("blood") || field.name.includes("medical")
                    ? "Additional Information"
                    : "Personal Information"

    if (!groupedFields[category]) {
      groupedFields[category] = []
    }
    groupedFields[category].push(field)
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-6">
      <div className="container max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/forms/select">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.back}
            </Link>
          </Button>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-slate-900">{t.reviewData || "Review Extracted Data"}</h1>
          <p className="text-slate-600 mt-2">
            {t.stepOf} 3 {t.of} 4: {t.reviewExtracted || "Review extracted data"}
          </p>
        </div>

        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="w-4 h-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Please review extracted data. Verify all information is correct before proceeding. Edit any fields that need
            correction.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Extracted Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {Object.entries(groupedFields).map(([category, fields]) => (
              <div key={category} className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2 text-blue-900">{category}</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {fields.map((field) => (
                    <div
                      key={field.name}
                      className={field.type === "textarea" || field.name.includes("address") ? "md:col-span-2" : ""}
                    >
                      <DynamicFormField
                        field={field}
                        value={formData[field.name] || ""}
                        onChange={(value) => handleInputChange(field.name, value)}
                        onVoiceInput={(text) => handleVoiceInput(field.name, text)}
                        voiceLanguage={voiceLanguage}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href={`/forms/${formType}/upload`}>{t.back}</Link>
          </Button>
          <Button size="lg" onClick={handleSaveAndContinue} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Done Editing"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
