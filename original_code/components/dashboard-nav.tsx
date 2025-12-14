"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { LanguageSelector } from "@/components/language-selector"
import { useTranslation } from "@/lib/translations"
import { useLanguage } from "@/lib/language-context"

interface DashboardNavProps {
  user: { email?: string }
  handleSignOut: () => Promise<void>
}

export function DashboardNav({ user, handleSignOut }: DashboardNavProps) {
  const { language, setLanguage } = useLanguage()
  const t = useTranslation(language)

  return (
    <div className="bg-white border-b">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">{t.smartFormFiller}</h1>
          <p className="text-sm text-slate-600">
            {t.welcome}, {user.email}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSelector currentLanguage={language} onLanguageChange={setLanguage} />
          <form action={handleSignOut}>
            <Button variant="ghost" type="submit">
              <LogOut className="w-4 h-4 mr-2" />
              {t.logout}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
