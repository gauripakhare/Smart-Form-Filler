"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FileText, CreditCard, Car, Award as IdCard, Plane } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useTranslation } from "@/lib/translations"
import { LanguageSelector } from "@/components/language-selector"

const formTypes = [
  {
    id: "aadhaar_update",
    name: "Aadhaar Update",
    description: "Update your Aadhaar information including name, address, and demographics",
    icon: IdCard,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-100",
    documents: ["Aadhaar Card", "Address Proof", "Photo ID"],
  },
  {
    id: "pan_registration",
    name: "PAN Application",
    description: "Apply for Permanent Account Number (Tax ID)",
    icon: CreditCard,
    iconColor: "text-purple-600",
    bgColor: "bg-purple-100",
    documents: ["Address Proof", "Photo ID", "Date of Birth Proof", "Aadhaar Card"],
  },
  {
    id: "passport",
    name: "Passport Application",
    description: "Apply for a new passport or renewal with biometric data",
    icon: FileText,
    iconColor: "text-green-600",
    bgColor: "bg-green-100",
    documents: ["Birth Certificate", "Address Proof", "Passport Photo", "PAN Card"],
  },
  {
    id: "driving_license",
    name: "Driving License",
    description: "Apply for new or renewal driving license",
    icon: Car,
    iconColor: "text-orange-600",
    bgColor: "bg-orange-100",
    documents: ["Address Proof", "Age Proof", "Medical Certificate", "Photo"],
  },
  {
    id: "visa",
    name: "Indian Visa Application",
    description: "Apply for Indian visa - Tourist, Business, Medical, Student, Employment",
    icon: Plane,
    iconColor: "text-indigo-600",
    bgColor: "bg-indigo-100",
    documents: ["Passport", "Photo", "Address Proof", "Supporting Documents"],
  },
]

export function FormSelectClient() {
  const { language, setLanguage } = useLanguage()
  const t = useTranslation(language)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-6">
      <div className="container max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">{t.selectForm}</h1>
            <p className="text-slate-600 mt-2">{t.chooseForm}</p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector currentLanguage={language} onLanguageChange={setLanguage} />
            <Button variant="outline" asChild>
              <Link href="/dashboard">{t.viewMyForms}</Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formTypes.map((form) => {
            const Icon = form.icon
            return (
              <Card key={form.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-lg ${form.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${form.iconColor}`} />
                    </div>
                  </div>
                  <CardTitle className="text-xl mt-4">{form.name}</CardTitle>
                  <CardDescription>{form.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">{t.requiredDocuments}:</p>
                      <ul className="space-y-1">
                        {form.documents.map((doc) => (
                          <li key={doc} className="text-sm text-slate-600 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            {doc}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button asChild className="w-full">
                      <Link href={`/forms/${form.id}/upload`}>
                        {t.continueWith} {form.name}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
