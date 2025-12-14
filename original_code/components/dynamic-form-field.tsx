"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { VoiceInput } from "@/components/voice-input"

interface FormField {
  name: string
  label: string
  type: string
  required?: boolean
  pattern?: string
  options?: string[]
  defaultValue?: string
}

interface DynamicFormFieldProps {
  field: FormField
  value: string
  onChange: (value: string) => void
  onVoiceInput: (text: string) => void
  voiceLanguage: string
}

export function DynamicFormField({ field, value, onChange, onVoiceInput, voiceLanguage }: DynamicFormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>
        {field.label} {field.required && <span className="text-red-500">*</span>}
      </Label>
      <div className="flex gap-2">
        {field.type === "select" && field.options ? (
          <>
            <Select value={value || field.defaultValue || ""} onValueChange={onChange}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={`Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <VoiceInput onTranscript={onVoiceInput} language={voiceLanguage} />
          </>
        ) : field.type === "textarea" ? (
          <>
            <Textarea
              id={field.name}
              value={value || field.defaultValue || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`Enter ${field.label}`}
              className="flex-1"
              rows={3}
            />
            <VoiceInput onTranscript={onVoiceInput} language={voiceLanguage} />
          </>
        ) : (
          <>
            <Input
              id={field.name}
              type={field.type}
              value={value || field.defaultValue || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`Enter ${field.label}`}
              maxLength={
                field.pattern === "\\d{12}"
                  ? 12
                  : field.pattern === "\\d{10}"
                    ? 10
                    : field.pattern === "\\d{6}"
                      ? 6
                      : undefined
              }
              required={field.required}
              className="flex-1"
            />
            <VoiceInput onTranscript={onVoiceInput} language={voiceLanguage} />
          </>
        )}
      </div>
    </div>
  )
}
