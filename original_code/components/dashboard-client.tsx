"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FileText, Plus, Trash2 } from "lucide-react"
import { DashboardNav } from "@/components/dashboard-nav"
import { useLanguage } from "@/lib/language-context"
import { useTranslation } from "@/lib/translations"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface DashboardClientProps {
  user: { email?: string }
  submissions: any[]
  handleSignOut: () => Promise<void>
}

export function DashboardClient({ user, submissions, handleSignOut }: DashboardClientProps) {
  const { language } = useLanguage()
  const t = useTranslation(language)
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (submissionId: string) => {
    if (!confirm(t.confirmDelete || "Are you sure you want to delete this form?")) {
      return
    }

    setDeletingId(submissionId)
    try {
      const response = await fetch(`/api/form-submissions/${submissionId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete")
      }

      router.refresh()
    } catch (error) {
      console.error("[AI-form-filler] Delete error:", error)
      alert(t.deleteFailed || "Failed to delete form. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  const totalForms = submissions?.length || 0
  const submittedForms = submissions?.filter((s) => s.status === "submitted").length || 0
  const draftForms = submissions?.filter((s) => s.status === "draft").length || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <DashboardNav user={user} handleSignOut={handleSignOut} />

      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">{t.manageFormSubmissions}</h2>
          </div>
          <Button asChild size="lg">
            <Link href="/forms/select">
              <Plus className="w-4 h-4 mr-2" />
              {t.newForm}
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-blue-600">{totalForms}</div>
              <p className="text-sm text-slate-600 mt-1">{t.totalForms}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-green-600">{submittedForms}</div>
              <p className="text-sm text-slate-600 mt-1">{t.submitted}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-orange-600">{draftForms}</div>
              <p className="text-sm text-slate-600 mt-1">{t.drafts}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t.yourFormSubmissions}</CardTitle>
            <p className="text-sm text-slate-600">{t.viewManageAllForms}</p>
          </CardHeader>
          <CardContent>
            {submissions && submissions.length > 0 ? (
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 capitalize">
                          {submission.form_type.replace(/_/g, " ")}
                        </p>
                        <p className="text-sm text-slate-500">
                          {new Date(submission.created_at).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                          submission.status === "submitted"
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            submission.status === "submitted" ? "bg-green-600" : "bg-orange-600"
                          }`}
                        />
                        {submission.status === t.submitted.toLowerCase() ? t.submitted : t.draft}
                      </span>
                      {submission.status === "draft" && (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/forms/${submission.form_type}/review/${submission.id}`}>
                            {language === "en" ? "Edit Draft" : t.doneEditing}
                          </Link>
                        </Button>
                      )}
                      {submission.status === "submitted" && (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/forms/${submission.form_type}/preview/${submission.id}`}>{t.view}</Link>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(submission.id)}
                        disabled={deletingId === submission.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 mb-4">{t.noFormsYet}</p>
                <Button asChild>
                  <Link href="/forms/select">{t.createFirstForm}</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
