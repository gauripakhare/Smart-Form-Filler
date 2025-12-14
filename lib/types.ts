export interface ExtractedData {
  fullName?: string
  dateOfBirth?: string
  gender?: string
  aadhaarNumber?: string
  panNumber?: string
  address?: string
  city?: string
  state?: string
  postalCode?: string
  mobileNumber?: string
  email?: string
  fatherName?: string
  motherName?: string
  [key: string]: string | undefined
}

export interface Document {
  id: string
  user_id: string
  form_submission_id?: string
  document_type: string
  file_url: string
  file_name: string
  file_size: number
  extracted_text?: string
  created_at: string
}

export interface FormSubmission {
  id: string
  user_id: string
  form_type: string
  status: "draft" | "submitted" | "approved"
  form_data: Record<string, unknown>
  extracted_data: ExtractedData
  submission_id?: string
  created_at: string
  updated_at: string
  submitted_at?: string
}

export type FormType = "aadhaar_update" | "passport" | "driving_license" | "pan_registration" | "visa"
