"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface VoiceInputProps {
  onTranscript: (text: string) => void
  className?: string
  language?: string // Add language support
}

export function VoiceInput({ onTranscript, className, language = "en-IN" }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSupported("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    }
  }, [])

  const startListening = () => {
    if (!isSupported) return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.lang = language
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      onTranscript(transcript)
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  if (!isSupported) {
    return null
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={startListening}
      disabled={isListening}
      className={cn("gap-2", className)}
    >
      {isListening ? (
        <>
          <MicOff className="w-4 h-4 animate-pulse" />
          Listening...
        </>
      ) : (
        <>
          <Mic className="w-4 h-4" />
          Voice Input
        </>
      )}
    </Button>
  )
}
