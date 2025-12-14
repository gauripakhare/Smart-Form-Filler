"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { formTemplates } from "@/lib/form-templates"
import { DynamicFormField } from "@/components/dynamic-form-field"
import { useLanguage } from "@/lib/language-context"
import { languages, useTranslation } from "@/lib/translations"
import { LanguageSelector } from "@/components/language-selector"

export default function FillFormPage() {
  const params = useParams()
  const formType = params?.formType as string
  const submissionId = params?.submissionId as string
  const router = useRouter()
  const { language, setLanguage } = useLanguage()
  const t = useTranslation(language)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showDraftSaved, setShowDraftSaved] = useState(false)

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
      setFormData(submission.form_data || submission.extracted_data || {})
    } catch (err) {
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

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const uniqueSubmissionId = `${Date.now()}${Math.random().toString(36).substr(2, 9)}`

      const response = await fetch(`/api/form-submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form_data: formData,
          status: "submitted",
          submitted_at: new Date().toISOString(),
          submission_id: uniqueSubmissionId,
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

  const handleSaveDraft = async () => {
    setSubmitting(true)
    try {
      const response = await fetch(`/api/form-submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form_data: formData,
          status: "draft",
        }),
      })

      if (!response.ok) throw new Error("Failed to save draft")

      setShowDraftSaved(true)
      setTimeout(() => setShowDraftSaved(false), 3000)
    } catch (err) {
      console.error("[AI-form-filler] Save draft error:", err)
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
            <Link href={`/forms/${formType}/review/${submissionId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.back}
            </Link>
          </Button>
          <LanguageSelector currentLanguage={language} onLanguageChange={setLanguage} />
        </div>

        <div>
          <h1 className="text-4xl font-bold text-slate-900">{template.officialName}</h1>
          <p className="text-slate-600 mt-2">
            {t.stepOf} 4 {t.of} 4: {t.completeFormSubmission}
          </p>
        </div>

        {showDraftSaved && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">{t.draftSaved}</div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{template.name}</CardTitle>
            <CardDescription>{t.pleaseFillRequired}</CardDescription>
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
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href={`/forms/${formType}/review/${submissionId}`}>{t.back}</Link>
            </Button>
            <Button variant="outline" onClick={handleSaveDraft} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t.savingDraft}
                </>
              ) : (
                t.saveDraft
              )}
            </Button>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="lg" asChild>
              <Link href={`/forms/${formType}/preview/${submissionId}`}>{t.preview || "Preview"}</Link>
            </Button>
            <Button size="lg" onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t.submitting}
                </>
              ) : (
                t.submit
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
