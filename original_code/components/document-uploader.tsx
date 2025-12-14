"use client"

import type React from "react"

import { useState } from "react"
import { Upload, FileText, Loader2, CheckCircle2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface UploadedFile {
  id: string
  name: string
  size: number
  url: string
  documentType: string
}

interface DocumentUploaderProps {
  documentType: string
  documentLabel: string
  formSubmissionId?: string
  onUploadComplete?: (file: UploadedFile) => void
  maxSize?: number
}

export function DocumentUploader({
  documentType,
  documentLabel,
  formSubmissionId,
  onUploadComplete,
  maxSize = 10 * 1024 * 1024, // 10MB default
}: DocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setError(null)

    // Validate file size
    if (selectedFile.size > maxSize) {
      setError(`File size must be less than ${maxSize / (1024 * 1024)}MB`)
      return
    }

    // Validate file type
    const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
    if (!validTypes.includes(selectedFile.type)) {
      setError("Only PDF, JPG, and PNG files are allowed")
      return
    }

    setFile(selectedFile)
    handleUpload(selectedFile)
  }

  const handleUpload = async (fileToUpload: File) => {
    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", fileToUpload)
      formData.append("documentType", documentType)
      if (formSubmissionId) {
        formData.append("formSubmissionId", formSubmissionId)
      }

      setUploadProgress(30)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      setUploadProgress(100)

      const uploadedFileData = {
        id: data.id,
        name: data.filename,
        size: data.size,
        url: data.url,
        documentType: data.documentType,
      }

      setUploadedFile(uploadedFileData)
      onUploadComplete?.(uploadedFileData)
    } catch (err) {
      setError("Upload failed. Please try again.")
      console.error("[AI-form-filler] Upload error:", err)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setFile(null)
    setUploadedFile(null)
    setUploadProgress(0)
    setError(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {documentLabel}
        </CardTitle>
        <CardDescription>Accepted formats: PDF, JPG, PNG | Max size: {maxSize / (1024 * 1024)}MB</CardDescription>
      </CardHeader>
      <CardContent>
        {!uploadedFile ? (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                id={`file-${documentType}`}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <label htmlFor={`file-${documentType}`} className="cursor-pointer flex flex-col items-center gap-2">
                {uploading ? (
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                ) : (
                  <Upload className="w-12 h-12 text-slate-400" />
                )}
                <p className="text-sm font-medium text-slate-700">
                  {uploading ? "Uploading..." : "Drag and drop or click to select"}
                </p>
                {file && <p className="text-xs text-slate-500">{file.name}</p>}
              </label>
            </div>

            {uploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-xs text-center text-slate-500">Uploading {uploadProgress}%</p>
              </div>
            )}

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">{uploadedFile.name}</p>
                <p className="text-xs text-green-700">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
