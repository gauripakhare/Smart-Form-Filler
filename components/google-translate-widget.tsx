"use client"

import { useEffect } from "react"

export function GoogleTranslateWidget() {
  useEffect(() => {
    // Add Google Translate script
    const script = document.createElement("script")
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
    script.async = true
    document.body.appendChild(script)

    // Initialize Google Translate
    ;(window as any).googleTranslateElementInit = () => {
      ;new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,hi,mr,bn,te,ta,gu,kn,ml,pa,or,as",
          layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        "google_translate_element",
      )
    }

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <div id="google_translate_element" className="inline-block">
      {/* Google Translate widget will be rendered here */}
    </div>
  )
}
