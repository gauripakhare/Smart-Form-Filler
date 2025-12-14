"use client"

import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { useState } from "react"

export function DownloadButton({ submissionId }: { submissionId: string }) {
  const [loading, setLoading] = useState(false)

  const handleDownloadPDF = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/generate-pdf/${submissionId}`)
      if (!response.ok) throw new Error("Failed to download")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `form-submission-${submissionId.substring(0, 8)}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download error:", error)
      alert("Failed to download form")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleDownloadPDF} variant="outline" className="w-full bg-transparent" disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Downloading...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Download Form
        </>
      )}
    </Button>
  )
}
