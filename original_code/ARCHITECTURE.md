# SmartFormFiller Architecture Document

## System Overview

SmartFormFiller is an AI-powered form filling assistant designed for Indian government services. The system automates document processing, data extraction, and form auto-filling with high accuracy.

## Architecture Components

### 1. Frontend (Next.js 16 + React 19)

- **Framework**: Next.js 16 with App Router
- **UI Library**: shadcn/ui + Tailwind CSS v4
- **State Management**: React hooks + SWR for server state
- **Language Support**: 8 Indian languages + English via Google Translate

#### Key Pages

- `/auth/*` - Authentication (Supabase Auth)
- `/dashboard` - User submissions dashboard
- `/forms/select` - Form type selection
- `/forms/[formType]/upload` - Document upload
- `/forms/[formType]/review/[id]` - Data review & editing
- `/forms/[formType]/fill/[id]` - Complete form filling
- `/forms/[formType]/success/[id]` - Submission confirmation

### 2. Backend (Next.js API Routes)

#### OCR Service (`/api/ocr`)

- **Provider**: OCR.space API
- **Engine**: Engine 2 (enhanced accuracy)
- **Input**: Document URL (from blob storage)
- **Output**: Extracted text
- **Performance**: ~2-3s per document

#### AI Extraction Service (`/api/extract-data`)

- **Model**: Groq (llama-3.3-70b-versatile)
- **Temperature**: 0.1 (high accuracy)
- **Input**: OCR text + document type
- **Output**: Structured JSON data
- **Performance**: ~2s per extraction

#### Multi-Document Extraction (`/api/extract-data-multi`)

- **Feature**: Process multiple documents concurrently
- **Strategy**: Smart merge with priority to longest/best values
- **Performance**: ~3-4s for 3-5 documents

#### Form Submissions API (`/api/form-submissions`)

- CRUD operations for form data
- Status tracking: draft → submitted
- Data storage: extracted_data + form_data

#### Upload API (`/api/upload`)

- **Storage**: Vercel Blob
- **Supported**: PDF, images (JPG, PNG, WEBP)
- **Metadata**: Document type, filename, size

### 3. Database (Supabase - PostgreSQL)

#### Schema

\`\`\`sql
-- Users & Authentication (Supabase Auth)
profiles (id, full_name, created_at)

-- Form Submissions
form_submissions (
id, user_id, form_type, status,
form_data JSONB, extracted_data JSONB,
submission_id, created_at, updated_at, submitted_at
)

-- Documents
documents (
id, user_id, form_submission_id,
document_type, file_url, file_name, file_size,
extracted_text, created_at
)
\`\`\`

#### Row Level Security (RLS)

- All tables protected by RLS policies
- Users can only access their own data
- Auth checks on every query

### 4. Storage (Vercel Blob)

- Document storage with unique URLs
- Automatic cleanup on deletion
- Public read access for OCR processing
- Environment variable: `BLOB_READ_WRITE_TOKEN`

### 5. AI Processing Pipeline

\`\`\`
┌─────────────┐ ┌──────────┐ ┌────────────┐ ┌───────────┐
│ Upload │────▶│ OCR │────▶│ AI Extract│────▶│ Auto-Fill│
│ Documents │ │ (OCR.space)│ │ (Groq) │ │ Form │
└─────────────┘ └──────────┘ └────────────┘ └───────────┘
│ │ │ │
▼ ▼ ▼ ▼
Blob Storage Extracted Text Structured Data Form Templates
\`\`\`

### 6. Form Templates System

#### Template Structure

- 5 form types: Aadhaar, PAN, Passport, Driving License, Visa
- Each template defines:
  - Official form name
  - Required documents
  - Form fields (name, type, validation)
  - Field categories (Personal, Address, Contact, etc.)

#### Field Types

- text, textarea, email, tel, date
- select (dropdown)
- Pattern validation (Aadhaar: 12 digits, PAN: 10 chars, etc.)

### 7. Multilingual Support

#### Implementation

- **Translation System**: `lib/translations.ts`
- **Languages**: English, Hindi, Marathi, Punjabi, Bengali, Telugu, Tamil, Gujarati, Kannada
- **Google Translate Widget**: Client-side translation for entire website
- **Voice Recognition**: Language-specific voice input

### 8. Features

#### Document Processing

- Multi-document upload
- Parallel OCR processing
- Smart data merging from multiple sources
- Document type detection

#### Form Auto-Fill

- AI-powered field mapping
- 90%+ accuracy for structured fields
- Editable extracted data
- Draft saving

#### Voice Input

- Real-time speech recognition
- Multi-language support
- Per-field voice input

#### Draft Management

- Save drafts at any stage
- Edit drafts from dashboard
- Resume where you left off

#### Form Submission

- Review before submit
- Unique submission ID generation
- PDF generation (future)
- Submission history

## Security

### Authentication

- Supabase Auth with email/password
- JWT tokens for session management
- Email verification required

### Authorization

- Row Level Security on all tables
- User isolation (can only access own data)
- API route authentication checks

### Data Protection

- Environment variables for sensitive keys
- HTTPS only
- Blob storage with secure URLs

## Performance Optimizations

### Client-Side

- React Server Components for initial render
- Client components for interactivity
- SWR for data caching
- Lazy loading for forms

### Server-Side

- Parallel document processing
- Database connection pooling
- Edge middleware for auth checks
- Optimized queries with indexes

### Network

- CDN for static assets
- Blob storage with edge caching
- Minimal API calls
- Progress indicators for long operations

## Deployment

### Vercel Platform

- Automatic deployments from Git
- Edge functions for API routes
- Environment variables via Vercel dashboard
- Preview deployments for PRs

### Environment Variables

\`\`\`
SUPABASE*\* - Database and auth
BLOB_READ_WRITE_TOKEN - Storage
OCR_SPACE_API_KEY - OCR service
API_KEY_GROQ_API_KEY - AI extraction
NEXT_PUBLIC*\* - Client-side variables
\`\`\`

## Future Enhancements

### Phase 2

- PDF generation with official government formats
- DigiLocker integration
- Handwritten text OCR (improved accuracy)
- Offline mode with client-side OCR

### Phase 3

- Direct government portal submission
- Real-time collaboration
- Mobile app (React Native)
- Advanced analytics dashboard

## Monitoring & Logging

### Current

- Console logging with `[AI-form-filler]` prefix
- Error tracking in API routes
- Performance metrics in browser console

### Future

- Sentry for error tracking
- Analytics for user behavior
- Performance monitoring dashboard
- Uptime monitoring

## Last Updated

January 2025
