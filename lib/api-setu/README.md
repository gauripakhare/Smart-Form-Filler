# API Setu Integration - Reality Check

## TL;DR

**API Setu is NOT a drop-in replacement for DigiLocker.** Here's what you need to know:

### The Reality

1. **API Setu is an API Marketplace** - not a single unified API
   - Each service (PAN, Aadhaar, GSTIN) is published by different government departments
   - Each has different endpoints, authentication methods, and schemas
   - Requires separate subscriptions and approvals

2. **Aadhaar Verification Still Needs DigiLocker**
   - API Setu's Aadhaar e-KYC service uses DigiLocker for consent
   - You cannot bypass DigiLocker for privacy-compliant Aadhaar verification
   - UIDAI requires OTP-based consent through DigiLocker

3. **PAN Verification is Possible**
   - Income Tax Department publishes PAN verification API on API Setu
   - Requires subscription and API credentials
   - Different authentication than Aadhaar

### What This Implementation Provides

✅ **Architecture** for future API Setu integration  
✅ **Documentation** of requirements and limitations  
✅ **Demo mode** for development and testing  
✅ **Migration path** when you have real credentials  
❌ **NOT a working production integration** without API Setu credentials  
❌ **NOT a DigiLocker replacement** for Aadhaar verification  

## Production Integration Requirements

To actually use API Setu in production:

### 1. Registration & Subscription (2-4 weeks)

1. Register at https://apisetu.gov.in
2. Browse API Marketplace
3. Subscribe to specific APIs:
   - **Income Tax Department → PAN Verification**
   - **UIDAI → Aadhaar e-KYC** (via DigiLocker)
   - **GSTN → Business Verification**
4. Wait for publisher approval (varies by department)
5. Receive service-specific credentials

### 2. Service-Specific Configuration

Each service has different requirements:

#### PAN Verification (Income Tax Department)
```env
API_SETU_PAN_ENDPOINT=https://apisetu.gov.in/income-tax/pan/v1/verify
API_SETU_PAN_CLIENT_ID=your_client_id
API_SETU_PAN_CLIENT_SECRET=your_client_secret
```

#### Aadhaar e-KYC (via DigiLocker)
```env
# Still uses DigiLocker OAuth
DIGILOCKER_CLIENT_ID=your_digilocker_id
DIGILOCKER_CLIENT_SECRET=your_digilocker_secret
```

#### GSTIN Verification (GST Network)
```env
API_SETU_GSTIN_ENDPOINT=https://apisetu.gov.in/gstn/verify
API_SETU_GSTIN_API_KEY=your_api_key
```

### 3. Implementation Effort

- **PAN Verification**: 2-3 days (straightforward API integration)
- **Aadhaar via DigiLocker**: Already implemented, no change needed
- **GSTIN Verification**: 1-2 days (depends on auth method)

## Current Implementation Status

| Service | Status | Works In Production? | Notes |
|---------|--------|----------------------|-------|
| PAN Verification | Demo Mode | ❌ No | Needs API Setu credentials |
| Aadhaar Verification | Delegated | ⚠️ Via DigiLocker | API Setu uses DigiLocker anyway |
| GSTIN Verification | Not Implemented | ❌ No | Future enhancement |

## Recommendations

### Option A: Keep DigiLocker (Recommended for MVP)
- **Pro**: Already works, battle-tested, covers Aadhaar
- **Pro**: No additional registrations or waiting for approvals
- **Con**: Requires OAuth flow (slightly more complex than API key)

### Option B: Hybrid Approach (Recommended for Scale)
- **DigiLocker**: For Aadhaar e-KYC (only option)
- **API Setu PAN**: For PAN verification (simpler than DigiLocker for PAN)
- **API Setu GSTIN**: For business verification (if needed)
- **Pro**: Best of both worlds
- **Con**: Two integration points to maintain

### Option C: Full API Setu (Not Recommended)
- **Con**: Aadhaar still needs DigiLocker anyway
- **Con**: 2-4 weeks registration and approval time
- **Con**: More complex configuration
- **Pro**: Centralized API management dashboard

## Migration Strategy

### Phase 1: Keep DigiLocker (Current State)
- All document verification via DigiLocker
- Works in demo mode and production
- ✅ **You are here**

### Phase 2: Add API Setu PAN (Optional)
1. Register on API Setu
2. Subscribe to Income Tax Department PAN API
3. Configure credentials
4. Switch PAN verification to API Setu
5. Keep Aadhaar via DigiLocker

### Phase 3: Add More Services (Optional)
- GSTIN verification
- Driving License verification
- Other government services as needed

## Why "Replacing DigiLocker with API Setu" Isn't Accurate

1. **Aadhaar e-KYC**: API Setu's Aadhaar service **IS** DigiLocker
2. **Privacy Compliance**: UIDAI mandates DigiLocker for Aadhaar verification
3. **Marketplace Model**: API Setu aggregates services, doesn't replace them

## The Bottom Line

If your goal is to:
- ✅ **Simplify authentication** → Consider API Setu PAN API
- ✅ **Add more services** → API Setu is a great choice
- ❌ **Remove DigiLocker dependency** → Not possible for Aadhaar

For Aadhaar verification, you'll always need DigiLocker (directly or through API Setu).

## Support

- **API Setu Portal**: https://apisetu.gov.in
- **Documentation**: https://docs.apisetu.gov.in
- **This Implementation**: See `/lib/api-setu/client.ts` for code structure
