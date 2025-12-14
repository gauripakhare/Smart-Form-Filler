"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2, FileText } from "lucide-react"
import { DownloadButton } from "@/components/download-button"
import { useLanguage } from "@/lib/language-context"
import { useTranslation } from "@/lib/translations"

export function SuccessPageClient({ formType, submissionId }: { formType: string; submissionId: string }) {
  const { language } = useLanguage()
  const t = useTranslation(language)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-6">
      <div className="container max-w-2xl mx-auto pt-16 space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-green-900">{t.formSubmitted || "Form Submitted Successfully!"}</h1>
          <p className="text-slate-600 mt-2">
            {t.applicationReceived || "Your application has been received and saved"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {t.submissionDetails || "Submission Details"}
            </CardTitle>
            <CardDescription>
              {t.submissionSaved || "Your submission has been saved with the following ID"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-slate-600 mb-1">{t.submissionId || "Submission ID"}</p>
              <p className="text-lg font-mono font-bold text-slate-900">{submissionId}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">{t.status || "Status"}</p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-green-600 rounded-full" />
                {t.submitted || "Submitted"}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">{t.submissionDate || "Submission Date"}</p>
              <p className="text-sm text-slate-600">
                {new Date().toLocaleDateString(language === "hi" ? "hi-IN" : "en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <DownloadButton submissionId={submissionId} />
              <Button asChild className="w-full">
                <Link href="/dashboard">{t.viewMyForms || "View My Forms"}</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link href="/forms/select">{t.fillAnotherForm || "Fill Another Form"}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
          <p className="font-medium mb-1">{t.whatsNext || "What's next?"}</p>
          <p className="text-blue-700">
            {t.nextSteps ||
              "This is a computer-generated document. No signature is required. You can download the PDF and print it for your records or submit it to the relevant government office."}
          </p>
        </div>
      </div>
    </div>
  )
}
