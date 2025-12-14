"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DocumentUploader } from "@/components/document-uploader"
import { ArrowLeft, Loader2, Info } from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { DigiLockerImport } from "@/components/digilocker-import"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLanguage } from "@/lib/language-context"
import { useTranslation } from "@/lib/translations"

const formConfigs = {
  aadhaar_update: {
    name: "Aadhaar Update",
    documents: [
      { type: "aadhaar_card", label: "Aadhaar Card" },
      { type: "address_proof", label: "Address Proof" },
      { type: "photo_id", label: "Photo ID" },
    ],
  },
  passport: {
    name: "Passport Application",
    documents: [
      { type: "birth_certificate", label: "Birth Certificate" },
      { type: "address_proof", label: "Address Proof" },
      { type: "passport_photo", label: "Passport Photo" },
      { type: "pan_card", label: "PAN Card" },
    ],
  },
  driving_license: {
    name: "Driving License",
    documents: [
      { type: "address_proof", label: "Address Proof" },
      { type: "age_proof", label: "Age Proof" },
      { type: "medical_certificate", label: "Medical Certificate" },
      { type: "photo", label: "Photo" },
    ],
  },
  pan_registration: {
    name: "PAN Registration",
    documents: [
      { type: "address_proof", label: "Address Proof" },
      { type: "photo_id", label: "Photo ID" },
      { type: "dob_proof", label: "Date of Birth Proof" },
    ],
  },
  visa: {
    name: "Indian Visa Application",
    documents: [
      { type: "passport", label: "Passport (Bio Page)" },
      { type: "passport_photo", label: "Passport Size Photo (2x2 inches)" },
      { type: "address_proof", label: "Address Proof (Home Country)" },
      { type: "supporting_documents", label: "Supporting Documents (Invitation Letter, Hotel Booking, etc.)" },
    ],
  },
}

export default function UploadDocumentsPage() {
  const params = useParams()
  const formType = params?.formType as string
  const router = useRouter()
  const { language } = useLanguage()
  const t = useTranslation(language)
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, unknown>>({})
  const [processing, setProcessing] = useState(false)
  const [processingStage, setProcessingStage] = useState("")
  const [progress, setProgress] = useState(0)

  const config = formConfigs[formType as keyof typeof formConfigs]

  if (!config) {
    return <div>Invalid form type</div>
  }

  const handleDocumentUpload = (documentType: string, file: unknown) => {
    setUploadedDocuments((prev) => ({
      ...prev,
      [documentType]: file,
    }))
  }

  const handleDigiLockerImport = (data: Record<string, string>) => {
    console.log("[AI-form-filler] DigiLocker data imported:", data)
    // Pre-fill would happen here
  }

  const allDocumentsUploaded = config.documents.every((doc) => uploadedDocuments[doc.type])

  const handleProcessDocuments = async () => {
    setProcessing(true)
    setProgress(0)

    try {
      setProcessingStage("Creating form submission...")
      setProgress(10)

      // Create form submission
      const submissionResponse = await fetch("/api/form-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType,
          status: "draft",
        }),
      })

      if (!submissionResponse.ok) throw new Error("Failed to create submission")
      const { id: submissionId } = await submissionResponse.json()

      setProcessingStage("Running OCR on all documents (supports handwritten text)...")
      setProgress(20)

      const documents = Object.values(uploadedDocuments) as Array<{
        id: string
        url: string
        documentType: string
      }>

      const documentsWithText = []

      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i]

        const ocrResponse = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileUrl: doc.url,
            documentId: doc.id,
          }),
        })

        if (ocrResponse.ok) {
          const ocrData = await ocrResponse.json()
          if (ocrData.extractedText && ocrData.extractedText.trim().length > 0) {
            documentsWithText.push({
              id: doc.id,
              extractedText: ocrData.extractedText,
              documentType: doc.documentType,
            })
            console.log("[AI-form-filler] OCR successful for document:", doc.id, "Text length:", ocrData.extractedText.length)
          } else {
            console.log("[AI-form-filler] OCR returned empty text for document:", doc.id)
          }
        } else {
          console.log("[AI-form-filler] OCR failed for document:", doc.id)
        }

        setProgress(20 + (i + 1) * (40 / documents.length))
      }

      if (documentsWithText.length === 0) {
        throw new Error(
          "No text could be extracted from the documents. Please ensure your documents are clear and try again.",
        )
      }

      console.log("[AI-form-filler] Documents with text:", documentsWithText.length)

      setProcessingStage("Extracting and auto-filling data with AI (>90% accuracy)...")
      setProgress(60)

      const extractResponse = await fetch("/api/extract-data-multi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documents: documentsWithText,
          documentType: formType,
          formType: formType,
        }),
      })

      console.log("[AI-form-filler] Extraction response status:", extractResponse.status)

      let errorData
      try {
        errorData = await extractResponse.json()
      } catch (jsonError) {
        console.error("[AI-form-filler] Failed to parse extraction response as JSON:", jsonError)
        console.error("[AI-form-filler] Response status:", extractResponse.status)
        console.error("[AI-form-filler] Response headers:", Object.fromEntries(extractResponse.headers.entries()))
        throw new Error(`Server returned invalid response (status ${extractResponse.status})`)
      }

      if (!extractResponse.ok) {
        console.error("[AI-form-filler] Extraction API returned error:", errorData)
        throw new Error(errorData.error || errorData.details || `Extraction failed (${extractResponse.status})`)
      }

      const { extractedData, performance } = errorData

      console.log("[AI-form-filler] Multi-document extraction complete:", {
        fieldCount: Object.keys(extractedData || {}).length,
        performance,
      })

      if (!extractedData || Object.keys(extractedData).length === 0) {
        throw new Error(
          "No data could be extracted from the documents. Please ensure your documents contain the required information.",
        )
      }

      setProgress(85)
      setProcessingStage("Auto-filling form fields...")

      // Update form submission with extracted data
      await fetch(`/api/form-submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extracted_data: extractedData,
          form_data: extractedData, // Pre-fill form data for editing
        }),
      })

      setProgress(100)
      setProcessingStage(`Complete! Auto-fill successful (${performance.timePerDocument}).`)

      // Redirect to review page
      setTimeout(() => {
        router.push(`/forms/${formType}/review/${submissionId}`)
      }, 800)
    } catch (error) {
      console.error("[AI-form-filler] Processing error:", error)
      const errorMessage = error instanceof Error ? error.message : "Error processing documents. Please try again."
      setProcessingStage(`Error: ${errorMessage}`)
      setProcessing(false)
      setProgress(0)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-6">
      <div className="container max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/forms/select">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.back}
            </Link>
          </Button>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-slate-900">{t.uploadDocuments || "Upload Your Documents"}</h1>
          <p className="text-slate-600 mt-2">
            {t.stepOf} 2 {t.of} 4: {t.uploadRequired || `Upload the required documents for ${config.name}`}
          </p>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <Info className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>{t.aiPowered || "AI-Powered Processing"}:</strong>{" "}
            {t.aiDescription ||
              "Our system supports handwritten text recognition, achieves >90% extraction accuracy, and processes documents in under 5 seconds each."}
          </AlertDescription>
        </Alert>

        <DigiLockerImport onImport={handleDigiLockerImport} />

        <div className="grid gap-6">
          {config.documents.map((doc) => (
            <DocumentUploader
              key={doc.type}
              documentType={doc.type}
              documentLabel={doc.label}
              onUploadComplete={(file) => handleDocumentUpload(doc.type, file)}
            />
          ))}
        </div>

        {processing && (
          <div className="bg-white p-6 rounded-lg border space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <p className="text-sm font-medium">{processingStage}</p>
            </div>
            <Progress value={progress} />
            <p className="text-xs text-slate-500 text-center">
              {t.processing || "Processing"} {progress}%
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button size="lg" disabled={!allDocumentsUploaded || processing} onClick={handleProcessDocuments}>
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t.processing || "Processing"}...
              </>
            ) : (
              t.continueToReview || "Continue to Review"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
