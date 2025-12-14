import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { submissionId } = body

    // Fetch submission data
    const { data: submission, error: fetchError } = await supabase
      .from("form_submissions")
      .select("*")
      .eq("id", submissionId)
      .single()

    if (fetchError || !submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // Generate PDF HTML content
    const formData = submission.form_data || {}
    const htmlContent = generatePDFHTML(submission.form_type, formData)

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="${submission.form_type}_${submissionId}.html"`,
      },
    })
  } catch (error) {
    console.error("[AI-form-filler] PDF generation error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

function generatePDFHTML(formType: string, formData: Record<string, any>): string {
  const formTypeNames: Record<string, string> = {
    aadhaar_update: "Aadhaar Update Request Form",
    pan_registration: "PAN Card Application Form",
    passport: "Passport Application Form",
    driving_license: "Driving License Application Form",
    visa: "Visa Application Form",
  }

  const formName = formTypeNames[formType] || "Government Form"

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${formName}</title>
  <style>
    @page { margin: 2cm; }
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      text-align: center;
      font-size: 18pt;
      margin-bottom: 10px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }
    h2 {
      font-size: 14pt;
      margin-top: 20px;
      margin-bottom: 10px;
      border-bottom: 1px solid #ccc;
      padding-bottom: 5px;
    }
    .field {
      margin-bottom: 15px;
      display: flex;
      align-items: baseline;
    }
    .field-label {
      font-weight: bold;
      min-width: 200px;
      margin-right: 10px;
    }
    .field-value {
      flex: 1;
      border-bottom: 1px solid #000;
      min-height: 20px;
      padding: 2px 5px;
    }
    .signature-section {
      margin-top: 50px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      width: 200px;
      border-top: 1px solid #000;
      padding-top: 5px;
      text-align: center;
    }
    .header-info {
      text-align: center;
      margin-bottom: 30px;
    }
    @media print {
      body { padding: 0; }
      button { display: none; }
    }
  </style>
</head>
<body>
  <div class="header-info">
    <h1>${formName}</h1>
    <p><strong>Government of India</strong></p>
    <p>Form generated on: ${new Date().toLocaleDateString("en-IN")}</p>
  </div>

  ${generateFieldsByCategory(formData)}

  <div class="signature-section">
    <div class="signature-box">
      Date: ${new Date().toLocaleDateString("en-IN")}
    </div>
    <div class="signature-box">
      Signature of Applicant
    </div>
  </div>

  <script>
    // Auto-print when opened
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
  `
}

function generateFieldsByCategory(formData: Record<string, any>): string {
  const categories: Record<string, string[]> = {
    "Personal Information": [],
    "Contact Information": [],
    "Address Information": [],
    "Family Information": [],
    "Document Information": [],
    "Additional Information": [],
  }

  // Categorize fields
  Object.entries(formData).forEach(([key, value]) => {
    if (!value) return

    const label = key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim()

    const field = `<div class="field">
      <div class="field-label">${label}:</div>
      <div class="field-value">${value}</div>
    </div>`

    if (key.includes("mobile") || key.includes("email") || key.includes("phone")) {
      categories["Contact Information"].push(field)
    } else if (key.includes("address") || key.includes("city") || key.includes("state") || key.includes("postal")) {
      categories["Address Information"].push(field)
    } else if (key.includes("father") || key.includes("mother") || key.includes("spouse")) {
      categories["Family Information"].push(field)
    } else if (key.includes("aadhaar") || key.includes("pan") || key.includes("passport")) {
      categories["Document Information"].push(field)
    } else if (
      key.includes("name") ||
      key.includes("dateOfBirth") ||
      key.includes("gender") ||
      key.includes("nationality")
    ) {
      categories["Personal Information"].push(field)
    } else {
      categories["Additional Information"].push(field)
    }
  })

  // Generate HTML for non-empty categories
  return Object.entries(categories)
    .filter(([_, fields]) => fields.length > 0)
    .map(([category, fields]) => `<h2>${category}</h2>\n${fields.join("\n")}`)
    .join("\n\n")
}
