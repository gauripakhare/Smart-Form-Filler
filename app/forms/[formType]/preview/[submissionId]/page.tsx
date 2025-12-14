"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Download, Send, FileImage } from "lucide-react"
import Link from "next/link"
import { LanguageSelector } from "@/components/language-selector"
import { useTranslation } from "@/lib/translations"
import { useLanguage } from "@/lib/language-context"

interface Document {
  id: string
  document_type: string
  file_url: string
  file_name: string
  file_size: number
  created_at: string
}

export default function PreviewPage() {
  const params = useParams()
  const router = useRouter()
  const formType = params?.formType as string
  const submissionId = params?.submissionId as string
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [documents, setDocuments] = useState<Document[]>([])
  const [documentsError, setDocumentsError] = useState(false)

  const { language, setLanguage } = useLanguage()
  const t = useTranslation(language)

  useEffect(() => {
    fetchSubmissionData()
    fetchDocuments()
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

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/documents/${submissionId}`)
      if (!response.ok) {
        setDocumentsError(true)
        return
      }

      const docs = await response.json()
      setDocuments(docs)
    } catch (err) {
      console.error("[AI-form-filler] Documents fetch error:", err)
      setDocumentsError(true)
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

        {documents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileImage className="w-5 h-5" />
                {language === "en" ? "Uploaded Documents" : "अपलोड किए गए दस्तावेज़"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {documents.map((doc) => (
                  <div key={doc.id} className="space-y-3" data-testid={`document-preview-${doc.id}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-700">
                        {doc.document_type
                          .replace(/_/g, " ")
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())
                          .trim()}
                      </p>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                        data-testid={`link-document-${doc.id}`}
                      >
                        {language === "en" ? "Open Full Size" : "पूर्ण आकार में खोलें"}
                      </a>
                    </div>
                    <div className="relative w-full bg-slate-100 rounded-lg border-2 border-slate-200 overflow-hidden">
                      {doc.file_name.match(/\.(jpg|jpeg|png)$/i) ? (
                        <div className="relative w-full aspect-[3/4]">
                          <img
                            src={doc.file_url}
                            alt={doc.document_type}
                            className="w-full h-full object-contain"
                            data-testid={`img-document-${doc.id}`}
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 px-4">
                          <FileImage className="w-12 h-12 text-slate-400 mb-2" />
                          <p className="text-sm text-slate-600 text-center">{doc.file_name}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
