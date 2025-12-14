import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { z } from "zod"

const groq = createGroq({
  apiKey: process.env.API_KEY_GROQ_API_KEY || process.env.GROQ_API_KEY,
})

const aadhaarSchema = z.object({
  aadhaarNumber: z.string().optional().describe("12-digit Aadhaar number"),
  fullName: z.string().optional().describe("Full name as per document"),
  dateOfBirth: z.string().optional().describe("Date of birth in YYYY-MM-DD format"),
  gender: z.enum(["Male", "Female", "Transgender"]).optional(),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  address: z.string().optional().describe("Complete address"),
  village: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional().describe("6-digit PIN code"),
  mobileNumber: z.string().optional().describe("10-digit mobile number"),
  email: z.string().email().or(z.literal("")).optional(),
})

const passportSchema = z.object({
  givenName: z.string().optional(),
  surname: z.string().optional(),
  dateOfBirth: z.string().optional().describe("Date in YYYY-MM-DD format"),
  placeOfBirth: z.string().optional(),
  gender: z.enum(["Male", "Female", "Transgender"]).optional(),
  maritalStatus: z.string().optional(),
  passportNumber: z.string().optional(),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  mobileNumber: z.string().optional(),
  email: z.string().email().or(z.literal("")).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
})

const drivingLicenseSchema = z.object({
  fullName: z.string().optional(),
  fatherOrHusbandName: z.string().optional(),
  dateOfBirth: z.string().optional().describe("Date in YYYY-MM-DD format"),
  gender: z.enum(["Male", "Female", "Transgender"]).optional(),
  bloodGroup: z.string().optional(),
  mobileNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  aadhaarNumber: z.string().optional(),
})

const panSchema = z.object({
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional().describe("Date in YYYY-MM-DD format"),
  fatherName: z.string().optional(),
  panNumber: z.string().optional().describe("10-character PAN number"),
  aadhaarNumber: z.string().optional(),
  mobileNumber: z.string().optional(),
  email: z.string().email().or(z.literal("")).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
})

const visaSchema = z.object({
  surname: z.string().optional(),
  givenName: z.string().optional(),
  nationality: z.string().optional(),
  dateOfBirth: z.string().optional().describe("Date in YYYY-MM-DD format"),
  placeOfBirth: z.string().optional(),
  gender: z.enum(["Male", "Female", "Transgender"]).optional(),
  passportNumber: z.string().optional(),
  passportDateOfIssue: z.string().optional(),
  passportDateOfExpiry: z.string().optional(),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  mobileNumber: z.string().optional(),
  email: z.string().email().or(z.literal("")).optional(),
  homeAddress: z.string().optional(),
  addressInIndia: z.string().optional(),
})

const formSchemas: Record<string, z.ZodObject<any>> = {
  aadhaar_update: aadhaarSchema,
  passport: passportSchema,
  driving_license: drivingLicenseSchema,
  pan_registration: panSchema,
  visa: visaSchema,
}

function getSchemaDescription(formType: string): string {
  const descriptions: Record<string, string> = {
    aadhaar_update: `{
  "aadhaarNumber": "12-digit number",
  "fullName": "full name",
  "dateOfBirth": "YYYY-MM-DD",
  "gender": "Male/Female/Transgender",
  "fatherName": "father's name",
  "motherName": "mother's name",
  "address": "complete address",
  "village": "village name",
  "district": "district",
  "state": "state",
  "postalCode": "6-digit PIN",
  "mobileNumber": "10-digit number",
  "email": "email address"
}`,
    passport: `{
  "givenName": "first name",
  "surname": "last name",
  "dateOfBirth": "YYYY-MM-DD",
  "placeOfBirth": "birth place",
  "gender": "Male/Female/Transgender",
  "maritalStatus": "marital status",
  "passportNumber": "passport number",
  "fatherName": "father's name",
  "motherName": "mother's name",
  "mobileNumber": "10-digit number",
  "email": "email",
  "address": "address",
  "city": "city",
  "state": "state",
  "postalCode": "PIN code"
}`,
    driving_license: `{
  "fullName": "full name",
  "fatherOrHusbandName": "father/husband name",
  "dateOfBirth": "YYYY-MM-DD",
  "gender": "Male/Female/Transgender",
  "bloodGroup": "blood group",
  "mobileNumber": "10-digit number",
  "address": "address",
  "city": "city",
  "district": "district",
  "state": "state",
  "postalCode": "PIN code",
  "aadhaarNumber": "12-digit number"
}`,
    pan_registration: `{
  "firstName": "first name",
  "middleName": "middle name",
  "lastName": "last name",
  "dateOfBirth": "YYYY-MM-DD",
  "fatherName": "father's name",
  "panNumber": "10-character PAN",
  "aadhaarNumber": "12-digit number",
  "mobileNumber": "10-digit number",
  "email": "email",
  "address": "address",
  "city": "city",
  "state": "state",
  "postalCode": "PIN code"
}`,
    visa: `{
  "surname": "last name",
  "givenName": "first name",
  "nationality": "country",
  "dateOfBirth": "YYYY-MM-DD",
  "placeOfBirth": "birth place",
  "gender": "Male/Female/Transgender",
  "passportNumber": "passport number",
  "passportDateOfIssue": "YYYY-MM-DD",
  "passportDateOfExpiry": "YYYY-MM-DD",
  "fatherName": "father's name",
  "motherName": "mother's name",
  "mobileNumber": "10-digit number",
  "email": "email",
  "homeAddress": "home address",
  "addressInIndia": "address in India"
}`,
  }
  return descriptions[formType] || descriptions.aadhaar_update
}

function normalizeExtractedData(data: any): any {
  const normalized = { ...data }

  // Convert empty strings to undefined for cleaner data
  Object.keys(normalized).forEach((key) => {
    if (normalized[key] === "" || normalized[key] === null) {
      delete normalized[key]
    }
  })

  if (normalized.gender) {
    const genderValue = normalized.gender.toString().toLowerCase().trim()

    if (
      genderValue === "female" ||
      genderValue === "f" ||
      genderValue === "mrs" ||
      genderValue === "ms" ||
      genderValue === "महिला" ||
      genderValue === "औरत"
    ) {
      normalized.gender = "Female"
    } else if (
      genderValue === "male" ||
      genderValue === "m" ||
      genderValue === "mr" ||
      genderValue === "मर्द" ||
      genderValue === "पुरुष"
    ) {
      normalized.gender = "Male"
    } else if (
      genderValue === "transgender" ||
      genderValue === "t" ||
      genderValue === "tg" ||
      genderValue === "ट्रांसजेंडर"
    ) {
      normalized.gender = "Transgender"
    } else {
      delete normalized.gender
    }
  }

  // Normalize date formats
  if (normalized.dateOfBirth) {
    normalized.dateOfBirth = normalized.dateOfBirth.trim()
  }

  if (normalized.mobileNumber) {
    const cleaned = normalized.mobileNumber.toString().replace(/\D/g, "")
    // If it starts with country code (91), remove it
    if (cleaned.length > 10 && cleaned.startsWith("91")) {
      normalized.mobileNumber = cleaned.slice(2, 12)
    } else if (cleaned.length >= 10) {
      normalized.mobileNumber = cleaned.slice(-10)
    } else {
      // Invalid phone number, remove it
      delete normalized.mobileNumber
    }
  }

  if (normalized.aadhaarNumber) {
    const cleaned = normalized.aadhaarNumber.toString().replace(/\D/g, "")
    if (cleaned.length >= 12) {
      normalized.aadhaarNumber = cleaned.slice(0, 12)
    } else if (cleaned.length > 0) {
      normalized.aadhaarNumber = cleaned
    } else {
      delete normalized.aadhaarNumber
    }
  }

  // Clean PAN numbers
  if (normalized.panNumber) {
    normalized.panNumber = normalized.panNumber.toUpperCase().replace(/\s/g, "").slice(0, 10)
  }

  // Clean postal codes
  if (normalized.postalCode) {
    const cleaned = normalized.postalCode.replace(/\D/g, "")
    if (cleaned.length >= 6) {
      normalized.postalCode = cleaned.slice(0, 6)
    } else if (cleaned.length > 0) {
      normalized.postalCode = cleaned
    } else {
      delete normalized.postalCode
    }
  }

  return normalized
}

export async function POST(request: NextRequest) {
  console.log("[AI-form-filler] === Multi-document extraction API called ===")

  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[AI-form-filler] Authentication failed:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[AI-form-filler] User authenticated:", user.email)

    const body = await request.json()
    const { documents, formType } = body

    console.log("[AI-form-filler] Extraction request:", {
      documentCount: documents?.length || 0,
      formType,
    })

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      console.error("[AI-form-filler] Invalid documents array")
      return NextResponse.json({ error: "No documents provided" }, { status: 400 })
    }

    const validDocuments = documents.filter(
      (doc: { extractedText?: string }) => doc.extractedText && doc.extractedText.trim().length > 0,
    )

    console.log("[AI-form-filler] Valid documents:", validDocuments.length)

    if (validDocuments.length === 0) {
      console.error("[AI-form-filler] No valid text in documents")
      return NextResponse.json(
        { error: "No readable text found in uploaded documents. Please upload clear, readable documents." },
        { status: 400 },
      )
    }

    const startTime = Date.now()

    const schema = formSchemas[formType] || aadhaarSchema
    const schemaDescription = getSchemaDescription(formType)

    const combinedText = validDocuments
      .map(
        (doc: any, index: number) =>
          `=== Document ${index + 1} (${doc.documentType || "Unknown"}) ===\n${doc.extractedText}`,
      )
      .join("\n\n")

    console.log("[AI-form-filler] Processing combined text length:", combinedText.length)
    console.log("[AI-form-filler] Using form type:", formType)

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting information from Indian government documents with >90% accuracy. 
Extract information exactly as it appears in the documents.
Return ONLY a valid JSON object with the extracted data, no additional text.
For dates, use YYYY-MM-DD format.
For Aadhaar numbers, extract all 12 digits.
For phone numbers, extract 10 digits without country code.
If information is unclear or not present, omit that field.
Handle both printed and handwritten text carefully.

Expected JSON format:
${schemaDescription}`,
        },
        {
          role: "user",
          content: `Extract all relevant information from these documents for a ${formType} form and return ONLY the JSON object:\n\n${combinedText}`,
        },
      ],
      temperature: 0.1,
    })

    console.log("[AI-form-filler] Raw AI response:", text.substring(0, 200))

    let extractedData
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      const jsonText = jsonMatch ? jsonMatch[0] : text
      const parsedData = JSON.parse(jsonText)

      const normalizedData = normalizeExtractedData(parsedData)

      // Validate with Zod schema
      extractedData = schema.parse(normalizedData)
    } catch (parseError) {
      console.error("[AI-form-filler] Failed to parse AI response:", parseError)
      console.error("[AI-form-filler] Response text:", text)
      throw new Error("Failed to parse extraction results. Please try again with clearer documents.")
    }

    const endTime = Date.now()
    const totalTime = (endTime - startTime) / 1000
    const timePerDocument = totalTime / validDocuments.length
    const meetsTarget = timePerDocument <= 5

    console.log("[AI-form-filler] Extraction complete:", {
      fieldsExtracted: Object.keys(extractedData).length,
      documentsProcessed: validDocuments.length,
      totalTime: `${totalTime.toFixed(2)}s`,
      timePerDocument: `${timePerDocument.toFixed(2)}s`,
      meetsTarget,
    })

    const cleanedData = Object.fromEntries(
      Object.entries(extractedData).filter(([_, value]) => value !== null && value !== undefined && value !== ""),
    )

    if (Object.keys(cleanedData).length === 0) {
      console.error("[AI-form-filler] No data extracted")
      return NextResponse.json(
        {
          error:
            "Could not extract information from documents. Please ensure they are clear and contain relevant data.",
        },
        { status: 422 },
      )
    }

    return NextResponse.json({
      success: true,
      extractedData: cleanedData,
      documentsProcessed: validDocuments.length,
      performance: {
        totalTime: `${totalTime.toFixed(2)}s`,
        timePerDocument: `${timePerDocument.toFixed(2)}s`,
        meetsTarget,
        target: "≤5s per document",
      },
    })
  } catch (error) {
    console.error("[AI-form-filler] ===== EXTRACTION ERROR =====")
    console.error("[AI-form-filler] Error:", error)
    console.error("[AI-form-filler] Error type:", error?.constructor?.name)
    console.error("[AI-form-filler] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[AI-form-filler] Stack trace:", error instanceof Error ? error.stack : "No stack")

    return NextResponse.json(
      {
        error: "Failed to extract data from documents",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
