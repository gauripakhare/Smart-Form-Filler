# API Setu Production Implementation TODO

## Current Status: DEMO MODE ONLY

This implementation provides **architecture** and **demo mode** but is **NOT production-ready**.

## What Works ✅

1. **Demo Mode**
   - Returns mock PAN data for testing
   - Allows UI/UX development without credentials
   - Clear error messages and fallbacks

2. **Architecture**
   - Service-configurable client structure
   - Extensible for multiple government services
   - Proper separation of concerns

3. **Documentation**
   - Honest about limitations
   - Clear requirements and timelines
   - Migration strategies

## What Does NOT Work ❌

### 1. OAuth Authentication (CRITICAL)

**Current Code:**
```typescript
headers["Authorization"] = `Bearer ${clientId}:${clientSecret}`
```

**Problem**: This is wrong. OAuth requires token exchange.

**Fix Needed:**
```typescript
// Step 1: Get access token
const tokenResponse = await fetch("https://apisetu.gov.in/oauth/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "pan_verify"
  })
})

const { access_token } = await tokenResponse.json()

// Step 2: Use access token
headers["Authorization"] = `Bearer ${access_token}`
```

**Required Actions:**
- [ ] Implement token retrieval function
- [ ] Cache tokens (they expire after X minutes)
- [ ] Handle token refresh
- [ ] Add token expiry handling

### 2. Signed Headers (for some services)

**Problem**: GSTN and some other services require request signing.

**Fix Needed:**
- [ ] Research specific signing algorithm (usually HMAC-SHA256)
- [ ] Implement request signing
- [ ] Add timestamp to prevent replay attacks
- [ ] Test with actual GSTIN API

**Example (pseudocode):**
```typescript
const timestamp = Date.now()
const payload = JSON.stringify(requestBody)
const signature = crypto
  .createHmac('sha256', clientSecret)
  .update(`${timestamp}${payload}`)
  .digest('hex')

headers["X-Timestamp"] = timestamp
headers["X-Signature"] = signature
```

### 3. Service-Specific Endpoints

**Problem**: Each service has different endpoint structure.

**What We Have**: Generic placeholder
**What We Need**: Actual endpoints from API Setu portal after subscription

**Fix Needed:**
- [ ] Subscribe to Income Tax PAN API
- [ ] Note exact endpoint URL from portal
- [ ] Review request/response schema in API docs
- [ ] Implement schema-specific handling

**Example Real Endpoints** (these may change):
```
PAN: https://apisetu.gov.in/income-tax/pan/v2/verify
GSTIN: https://apisetu.gov.in/gstn/taxpayer/v1/search
```

### 4. Error Handling

**Problem**: Current error handling is generic.

**Fix Needed:**
- [ ] Handle specific error codes from each service
- [ ] Implement retry logic for rate limits
- [ ] Add proper logging
- [ ] Handle service-specific error formats

### 5. Request/Response Schema Mapping

**Problem**: We assume a generic schema, but each service is different.

**Example PAN Response** (hypothetical):
```json
{
  "pan": "ABCDE1234F",
  "name": "FULL NAME",
  "status": "ACTIVE",
  "last_updated": "2024-01-01"
}
```

**Fix Needed:**
- [ ] Get actual schema from API docs after subscription
- [ ] Update normalizePANData() with correct field mapping
- [ ] Handle optional vs required fields
- [ ] Add validation

## Implementation Checklist for Production

### Phase 1: Registration (Do This First)
- [ ] Register at https://apisetu.gov.in
- [ ] Subscribe to Income Tax Department PAN API
- [ ] Wait for approval (5-10 business days)
- [ ] Receive credentials and endpoint URLs

### Phase 2: Authentication (Week 2-3)
- [ ] Implement OAuth token exchange
- [ ] Add token caching
- [ ] Implement token refresh logic
- [ ] Test auth with sandbox environment

### Phase 3: PAN Integration (Week 3)
- [ ] Update endpoint to real URL from portal
- [ ] Implement correct request schema
- [ ] Update response normalization
- [ ] Add service-specific error handling
- [ ] Test with real PAN numbers in sandbox

### Phase 4: Testing (Week 4)
- [ ] Test with valid PAN numbers
- [ ] Test with invalid PAN numbers
- [ ] Test error scenarios
- [ ] Load testing
- [ ] Security review

### Phase 5: Deployment (Week 4-5)
- [ ] Update environment variables
- [ ] Deploy to staging
- [ ] Smoke tests in staging
- [ ] Deploy to production
- [ ] Monitor logs and errors

## Realistic Timeline

**Minimum**: 4 weeks (if everything goes smoothly)
**Realistic**: 6-8 weeks (accounting for delays)

**Breakdown:**
- Registration & Approval: 1-2 weeks
- Development: 1-2 weeks
- Testing: 1 week
- Deployment: 1 week
- Buffer for issues: 1-2 weeks

## Alternative: Keep DigiLocker

**If your only need is Aadhaar + PAN:**
- DigiLocker already works ✅
- No waiting for approvals ✅
- Battle-tested ✅
- Covers both needs ✅

**API Setu makes sense when you need:**
- GSTIN verification
- Education credentials
- Driving license verification
- 10+ different government services

## Questions?

**Q: Can I use this in production now?**  
A: No. Demo mode only.

**Q: What do I need for production?**  
A: API Setu registration, credentials, and the fixes listed above.

**Q: How long until production-ready?**  
A: 4-8 weeks minimum.

**Q: Should I wait or use DigiLocker?**  
A: Use DigiLocker for Aadhaar. Consider API Setu for PAN if you plan to add GSTIN/other services later.

## Summary

This code provides:
- ✅ Demo mode for development
- ✅ Architecture for future implementation
- ✅ Documentation of requirements
- ❌ Production-ready OAuth implementation
- ❌ Signed request support
- ❌ Real endpoint integration
- ❌ Service-specific schema handling

**Bottom line**: Great starting point, but needs 4-8 weeks of additional work for production.
