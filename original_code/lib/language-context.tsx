"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface LanguageContextType {
  language: string
  setLanguage: (lang: string) => void
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState("en")

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("app_language")
    if (savedLanguage) {
      setLanguageState(savedLanguage)
    }
  }, [])

  // Save language to localStorage when it changes
  const setLanguage = (lang: string) => {
    setLanguageState(lang)
    localStorage.setItem("app_language", lang)
  }

  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  return useContext(LanguageContext)
}
