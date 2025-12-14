import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.API_KEY_GROQ_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { extractedText, documentType } = await request.json()

    if (!extractedText) {
      return NextResponse.json({ error: "Extracted text required" }, { status: 400 })
    }

    const prompt = `You are an AI assistant specialized in extracting information from Indian government documents with high accuracy (>90%).

Document Type: ${documentType}
OCR Text: ${extractedText}

Extract the following information in JSON format. Be very accurate and only include fields that you can confidently extract:

Personal Information:
- fullName: Full name as per document
- dateOfBirth: Date of birth in YYYY-MM-DD format
- gender: Male/Female/Transgender
- placeOfBirth: Place of birth if present

Identity Numbers:
- aadhaarNumber: 12 digit Aadhaar number (format: XXXX XXXX XXXX)
- panNumber: 10 character PAN number (format: AAAAA9999A)
- passportNumber: Passport number if present
- voterIdNumber: Voter ID number if present
- drivingLicenseNumber: Driving license number if present

Contact Information:
- mobileNumber: 10 digit mobile number
- email: Email address
- telephone: Landline with STD code

Address Information:
- address: Complete full address
- houseNo: House/Flat/Door number
- buildingName: Building/Premises name
- roadStreet: Road/Street/Lane name
- area: Area/Locality/Taluka
- village: Village/Town/City name
- city: City name
- district: District name
- state: State/UT name
- postalCode: 6 digit PIN code
- country: Country (default India)
- policeStation: Police station if present

Family Information:
- fatherName: Father's full name
- motherName: Mother's full name
- spouseName: Spouse's name if applicable
- fatherNationality: Father's nationality
- motherNationality: Mother's nationality

Employment & Education:
- occupation: Present occupation
- employerName: Employer/Business name
- employerAddress: Employer address
- educationQualification: Educational qualification

Additional Information:
- maritalStatus: Single/Married/Divorced/Widowed/Separated
- nationality: Nationality
- religion: Religion if present
- bloodGroup: Blood group if present
- distinguishingMark: Any visible identification marks

Return valid JSON only with extracted fields. Omit fields that are not found in the text.`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1, // Low temperature for high accuracy
      max_tokens: 2048,
    })

    const responseText = completion.choices[0]?.message?.content || "{}"

    let extractedData
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      extractedData = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

      // Clean and validate extracted data
      Object.keys(extractedData).forEach((key) => {
        if (extractedData[key] === null || extractedData[key] === undefined || extractedData[key] === "") {
          delete extractedData[key]
        }
      })
    } catch (parseError) {
      console.error("[AI-form-filler] JSON parse error:", parseError)
      extractedData = {}
    }

    console.log("[AI-form-filler] Extracted data:", extractedData)

    return NextResponse.json({
      success: true,
      extractedData,
      accuracy: Object.keys(extractedData).length > 5 ? "high" : "medium",
    })
  } catch (error) {
    console.error("[AI-form-filler] Data extraction error:", error)
    return NextResponse.json({ error: "Data extraction failed" }, { status: 500 })
  }
}
