import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function escapeHtml(text: string): string {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

function formatFieldLabel(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim()
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ submissionId: string }> }) {
  try {
    const { submissionId } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: submission, error } = await supabase
      .from("form_submissions")
      .select("*")
      .eq("id", submissionId)
      .eq("user_id", user.id)
      .single()

    if (error || !submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    const formData =
      submission.form_data && Object.keys(submission.form_data).length > 0
        ? submission.form_data
        : submission.extracted_data || {}

    // Form type names mapping
    const formTypeNames: Record<string, string> = {
      aadhaar_update: "AADHAAR UPDATE REQUEST FORM",
      pan_registration: "PAN CARD APPLICATION FORM",
      passport: "PASSPORT APPLICATION FORM",
      driving_license: "DRIVING LICENSE APPLICATION FORM",
      visa: "INDIAN VISA APPLICATION FORM",
    }

    const formTitle = formTypeNames[submission.form_type] || "GOVERNMENT FORM"

    const groupedData: Record<string, Record<string, any>> = {
      "Personal Information": {},
      "Contact Information": {},
      "Address Information": {},
      "Family Information": {},
      "Document Information": {},
      "Employment & Education": {},
      "Visa & Nationality": {},
      "Additional Information": {},
    }

    Object.entries(formData).forEach(([key, value]) => {
      if (!value || value === "") return

      const keyLower = key.toLowerCase()

      if (
        keyLower.includes("mobile") ||
        keyLower.includes("email") ||
        keyLower.includes("phone") ||
        keyLower.includes("contact")
      ) {
        groupedData["Contact Information"][key] = value
      } else if (
        keyLower.includes("address") ||
        keyLower.includes("city") ||
        keyLower.includes("state") ||
        keyLower.includes("postal") ||
        keyLower.includes("village") ||
        keyLower.includes("district") ||
        keyLower.includes("house") ||
        keyLower.includes("street") ||
        keyLower.includes("pincode") ||
        keyLower.includes("zip")
      ) {
        groupedData["Address Information"][key] = value
      } else if (
        keyLower.includes("father") ||
        keyLower.includes("mother") ||
        keyLower.includes("spouse") ||
        keyLower.includes("guardian")
      ) {
        groupedData["Family Information"][key] = value
      } else if (
        keyLower.includes("aadhaar") ||
        keyLower.includes("pan") ||
        keyLower.includes("passport") ||
        keyLower.includes("voter") ||
        keyLower.includes("license")
      ) {
        groupedData["Document Information"][key] = value
      } else if (
        keyLower.includes("employment") ||
        keyLower.includes("employer") ||
        keyLower.includes("occupation") ||
        keyLower.includes("education") ||
        keyLower.includes("qualification")
      ) {
        groupedData["Employment & Education"][key] = value
      } else if (keyLower.includes("visa") || keyLower.includes("nationality") || keyLower.includes("citizen")) {
        groupedData["Visa & Nationality"][key] = value
      } else if (
        keyLower.includes("name") ||
        keyLower.includes("dateofbirth") ||
        keyLower.includes("dob") ||
        keyLower.includes("gender") ||
        keyLower.includes("marital") ||
        keyLower.includes("blood") ||
        keyLower.includes("nationality")
      ) {
        groupedData["Personal Information"][key] = value
      } else {
        groupedData["Additional Information"][key] = value
      }
    })

    const sectionsHtml = Object.entries(groupedData)
      .filter(([_, data]) => Object.keys(data).length > 0)
      .map(([category, data]) => {
        const fieldsHtml = Object.entries(data)
          .map(([key, value]) => {
            const label = formatFieldLabel(key)
            const displayValue = String(value).trim()
            return `
            <div class="field">
              <div class="label">${label}</div>
              <div class="value">${displayValue}</div>
            </div>`
          })
          .join("")

        return `
        <div class="section">
          <div class="section-title">${category}</div>
          ${fieldsHtml}
        </div>`
      })
      .join("")

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${formTitle}</title>
  <style>
    @media print {
      * { margin: 0; padding: 0; }
      body { margin: 0; padding: 20px; }
      .no-print { display: none !important; }
    }
    * { box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      background: white;
      color: #000;
      line-height: 1.6;
    }
    .container {
      width: 8.5in;
      margin: 0 auto;
      padding: 20px;
      background: white;
    }
    .header { 
      text-align: center; 
      border-bottom: 3px solid #1e40af; 
      padding-bottom: 15px; 
      margin-bottom: 20px; 
    }
    .title { 
      font-size: 20px; 
      font-weight: bold; 
      color: #1e40af; 
      margin-bottom: 5px;
    }
    .subtitle { 
      color: #666; 
      font-size: 12px;
    }
    .submission-info { 
      background: #f0f4ff; 
      padding: 12px; 
      border-left: 4px solid #3b82f6;
      margin-bottom: 20px;
    }
    .info-row {
      width: 100%;
      margin: 6px 0;
      overflow: auto;
      clear: both;
    }
    .info-cell {
      width: 48%;
      float: left;
      margin-right: 2%;
      box-sizing: border-box;
    }
    .info-cell:nth-child(2n) {
      margin-right: 0;
      float: right;
    }
    .info-label { 
      font-weight: bold; 
      color: #333; 
      font-size: 10px;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .info-value { 
      color: #000; 
      font-size: 12px;
      margin-top: 2px;
      word-break: break-word;
      word-wrap: break-word;
      white-space: pre-wrap;
    }
    .status { 
      background: #d1fae5; 
      color: #065f46; 
      padding: 3px 8px; 
      border-radius: 3px; 
      font-size: 10px; 
      font-weight: bold;
      text-transform: uppercase;
      display: inline-block;
    }
    .section { 
      margin: 18px 0;
      clear: both;
      page-break-inside: avoid;
    }
    .section-title { 
      font-size: 13px; 
      font-weight: bold; 
      color: #1e293b; 
      border-bottom: 2px solid #e0e0e0; 
      padding-bottom: 6px; 
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    .field { 
      margin: 8px 0; 
      padding: 8px 10px; 
      background: #fafafa; 
      border-left: 3px solid #3b82f6;
      page-break-inside: avoid;
      clear: both;
    }
    .label { 
      font-weight: bold; 
      color: #555; 
      font-size: 10px;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .value { 
      color: #000; 
      font-size: 13px;
      word-wrap: break-word;
      white-space: normal;
      word-break: break-word;
    }
    .footer { 
      margin-top: 30px; 
      padding-top: 15px; 
      border-top: 2px solid #e0e0e0; 
      text-align: center; 
      color: #666; 
      font-size: 10px;
      clear: both;
    }
    .footer p { margin: 4px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title">${formTitle}</div>
      <div class="subtitle">Government of India | Official Form Submission</div>
    </div>

    <div class="submission-info">
      <div class="info-row">
        <div class="info-cell">
          <div class="info-label">Submission ID</div>
          <div class="info-value">${submission.submission_id || submissionId.substring(0, 8).toUpperCase()}</div>
        </div>
        <div class="info-cell">
          <div class="info-label">Status</div>
          <div><span class="status">${submission.status}</span></div>
        </div>
      </div>
      <div class="info-row">
        <div class="info-cell">
          <div class="info-label">Submission Date</div>
          <div class="info-value">${new Date(submission.submitted_at || submission.created_at).toLocaleDateString(
            "en-IN",
            { year: "numeric", month: "short", day: "numeric" },
          )}</div>
        </div>
        <div class="info-cell">
          <div class="info-label">Form Type</div>
          <div class="info-value">${submission.form_type.replace(/_/g, " ").toUpperCase()}</div>
        </div>
      </div>
    </div>

    ${sectionsHtml}

    <div class="footer">
      <p><strong>This is a computer-generated document.</strong></p>
      <p>Generated on ${new Date().toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}</p>
      <p style="margin-top: 8px;">Submission ID: <strong>${submission.submission_id || submissionId.substring(0, 8).toUpperCase()}</strong></p>
    </div>
  </div>
</body>
</html>
    `

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="form-${submission.form_type}-${submissionId.substring(0, 8)}.html"`,
      },
    })
  } catch (error) {
    console.error("[AI-form-filler] PDF generation error:", error)
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 })
  }
}
