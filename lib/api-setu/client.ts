/**
 * API Setu Client for Government Services
 * Documentation: https://apisetu.gov.in
 * 
 * IMPORTANT: API Setu is an API *marketplace* - each service (PAN, Aadhaar, GSTIN)
 * is published by different government departments with their own:
 * - Endpoints (publisher-specific routes)
 * - Authentication methods (OAuth, API keys, signed requests)
 * - Request/response schemas
 * - Consent mechanisms
 * 
 * This client provides a foundation for integration. Production use requires:
 * 1. Registration at https://apisetu.gov.in
 * 2. Subscription to specific APIs (Income Tax for PAN, DigiLocker for Aadhaar)
 * 3. Service-specific credentials and configuration
 */

export interface ApiSetuServiceConfig {
  serviceName: string
  endpoint: string
  clientId?: string
  clientSecret?: string
  apiKey?: string
  authType: "api_key" | "oauth" | "signed"
}

export interface ApiSetuConfig {
  services: {
    pan?: ApiSetuServiceConfig
    aadhaar?: ApiSetuServiceConfig
    [key: string]: ApiSetuServiceConfig | undefined
  }
}

export interface AadhaarVerificationRequest {
  aadhaarNumber: string
  consent: boolean
}

export interface PANVerificationRequest {
  panNumber: string
  consent: boolean
}

export interface DocumentVerificationResponse {
  success: boolean
  data?: {
    fullName?: string
    dateOfBirth?: string
    gender?: string
    address?: string
    state?: string
    postalCode?: string
    mobileNumber?: string
    email?: string
    [key: string]: any
  }
  error?: string
  message?: string
}

export class ApiSetuClient {
  private config: ApiSetuConfig

  constructor(config: ApiSetuConfig) {
    this.config = config
  }

  /**
   * Verify Aadhaar details via DigiLocker
   * 
   * NOTE: Aadhaar verification on API Setu uses DigiLocker integration
   * This requires:
   * 1. DigiLocker OAuth token
   * 2. OTP-based consent from user
   * 3. Compliance with UIDAI privacy guidelines
   * 
   * Raw Aadhaar number submission is NOT supported for privacy compliance
   */
  async verifyAadhaar(request: AadhaarVerificationRequest): Promise<DocumentVerificationResponse> {
    return {
      success: false,
      error: "Aadhaar verification requires DigiLocker integration. Please use DigiLocker OAuth flow for privacy-compliant Aadhaar verification.",
      message: "API Setu's Aadhaar e-KYC service still uses DigiLocker for consent and privacy compliance. Configure DigiLocker integration to enable Aadhaar verification.",
    }
  }

  /**
   * Verify PAN details
   * 
   * NOTE: Requires subscription to Income Tax Department PAN API on API Setu
   * Configure service endpoint and credentials via ApiSetuConfig
   */
  async verifyPAN(request: PANVerificationRequest): Promise<DocumentVerificationResponse> {
    if (!request.consent) {
      return {
        success: false,
        error: "User consent required for PAN verification",
      }
    }

    const panConfig = this.config.services.pan
    if (!panConfig) {
      return {
        success: false,
        error: "PAN verification service not configured",
        message: "Add PAN service configuration to enable verification. See API_SETU_SETUP.md for details.",
      }
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (panConfig.authType === "api_key" && panConfig.apiKey) {
        headers["X-API-Key"] = panConfig.apiKey
      } else if (panConfig.authType === "oauth" && panConfig.clientId && panConfig.clientSecret) {
        headers["Authorization"] = `Bearer ${panConfig.clientId}:${panConfig.clientSecret}`
      }

      const response = await fetch(panConfig.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          pan_number: request.panNumber,
          consent: request.consent,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.message || "PAN verification failed",
        }
      }

      const data = await response.json()
      return {
        success: true,
        data: this.normalizePANData(data),
      }
    } catch (error) {
      console.error("[ApiSetu] PAN verification error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Verification failed",
      }
    }
  }

  /**
   * Normalize Aadhaar API response to common format
   */
  private normalizeAadhaarData(rawData: any): DocumentVerificationResponse["data"] {
    return {
      fullName: rawData.name || rawData.full_name,
      dateOfBirth: rawData.dob || rawData.date_of_birth,
      gender: rawData.gender,
      address: this.formatAddress(rawData.address || rawData),
      state: rawData.state || rawData.address?.state,
      postalCode: rawData.pincode || rawData.postal_code || rawData.address?.pincode,
      mobileNumber: rawData.mobile || rawData.phone,
      email: rawData.email,
    }
  }

  /**
   * Normalize PAN API response to common format
   */
  private normalizePANData(rawData: any): DocumentVerificationResponse["data"] {
    return {
      fullName: rawData.name || rawData.full_name,
      dateOfBirth: rawData.dob || rawData.date_of_birth,
    }
  }

  /**
   * Format address from various possible structures
   */
  private formatAddress(addressData: any): string {
    if (typeof addressData === "string") return addressData

    const parts = [
      addressData.house || addressData.house_no,
      addressData.street,
      addressData.landmark,
      addressData.locality || addressData.area,
      addressData.city || addressData.district,
      addressData.state,
      addressData.pincode || addressData.postal_code,
    ].filter(Boolean)

    return parts.join(", ")
  }
}

/**
 * Create API Setu client from environment variables
 * 
 * Falls back to null if not configured, triggering demo mode
 */
export function createApiSetuClient(): ApiSetuClient | null {
  const panEndpoint = process.env.API_SETU_PAN_ENDPOINT
  const panClientId = process.env.API_SETU_PAN_CLIENT_ID
  const panClientSecret = process.env.API_SETU_PAN_CLIENT_SECRET
  const panApiKey = process.env.API_SETU_PAN_API_KEY

  const hasPanConfig = panEndpoint && (panApiKey || (panClientId && panClientSecret))

  if (!hasPanConfig) {
    console.warn("[ApiSetu] PAN service not configured. Using demo mode.")
    console.warn("[ApiSetu] Set API_SETU_PAN_ENDPOINT and credentials to enable.")
    return null
  }

  return new ApiSetuClient({
    services: {
      pan: {
        serviceName: "Income Tax PAN Verification",
        endpoint: panEndpoint,
        clientId: panClientId,
        clientSecret: panClientSecret,
        apiKey: panApiKey,
        authType: panApiKey ? "api_key" : "oauth",
      },
    },
  })
}

/**
 * Mock data for development/testing when API key is not available
 */
export function getMockVerificationData(documentType: string): DocumentVerificationResponse {
  const mockData: Record<string, DocumentVerificationResponse["data"]> = {
    aadhaar: {
      fullName: "Sample User Name",
      dateOfBirth: "1990-01-01",
      gender: "Male",
      address: "Sample Address, City, State - 123456",
      state: "Maharashtra",
      postalCode: "400001",
      mobileNumber: "9876543210",
      email: "user@example.com",
    },
    pan: {
      fullName: "Sample User Name",
      dateOfBirth: "1990-01-01",
    },
  }

  return {
    success: true,
    data: mockData[documentType.toLowerCase()] || {},
    message: "Demo mode: Add API_SETU_KEY environment variable to enable live verification",
  }
}
