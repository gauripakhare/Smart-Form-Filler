"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, FileText, Info, CheckCircle } from "lucide-react"

interface DigiLockerImportProps {
  onImport: (data: Record<string, string>) => void
}

export function DigiLockerImport({ onImport }: DigiLockerImportProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleAuthenticate = () => {
    setLoading(true)
    setError("")

    // Redirect to DigiLocker OAuth
    window.location.href = "/api/digilocker/auth"
  }

  const handleImport = async () => {
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      const response = await fetch("/api/digilocker/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: "aadhaar" }),
      })

      const result = await response.json()

      if (result.success) {
        const dataToImport = result.mockData || result.data || {}
        onImport(dataToImport)
        setSuccess(true)
        setError("")
        setIsAuthenticated(true)
      } else {
        setError(result.error || "DigiLocker import failed")
      }
    } catch (err) {
      setError("Failed to connect to DigiLocker")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Import from DigiLocker
        </CardTitle>
        <CardDescription>
          Securely import your documents from DigiLocker - India's digital document wallet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>How to enable:</strong> Add your DigiLocker Client ID and Client Secret to environment variables.
            Get credentials from{" "}
            <a
              href="https://partners.digitallocker.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium"
            >
              DigiLocker Partners Portal
            </a>
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Documents imported successfully from DigiLocker!
            </AlertDescription>
          </Alert>
        )}

        {!isAuthenticated ? (
          <Button onClick={handleAuthenticate} disabled={loading} className="w-full bg-transparent" variant="outline">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Connect to DigiLocker
              </>
            )}
          </Button>
        ) : (
          <Button onClick={handleImport} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing Documents...
              </>
            ) : (
              "Import Documents from DigiLocker"
            )}
          </Button>
        )}

        <p className="text-xs text-slate-500 text-center">Demo mode enabled. Add production API keys for live data.</p>
      </CardContent>
    </Card>
  )
}
