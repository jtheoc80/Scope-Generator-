## Instant Proposal Companion App (Mobile)

This repo now includes a **mobile-first “instant proposal” pipeline** backed by Next.js App Router endpoints under `/app/api/mobile/*` and DB tables in `shared/schema.ts`.

### Architecture (high level)
- **Mobile app (Expo/React Native)** calls Next.js API routes under `/api/mobile/*`.
- **Direct photo upload** uses **S3-compatible presigned URLs**.
- **Draft generation** uses your existing `aiService.enhanceScope()` plus template + pricing rules.
- **Submit** converts the draft into a normal `proposals` row so the existing web UI can review at `/proposals/:id`.

### On-site sequence (instant proposal)
1. `POST /api/mobile/jobs` → create a job
2. `POST /api/mobile/jobs/:jobId/photos/presign` → get `{uploadUrl, publicUrl}`
3. `PUT uploadUrl` → upload image directly to storage
4. `POST /api/mobile/jobs/:jobId/photos` → register `publicUrl`
5. `POST /api/mobile/jobs/:jobId/draft` → generate a draft payload
6. `POST /api/mobile/jobs/:jobId/submit` → create proposal + return web review URL

### API routes
- `POST /api/mobile/jobs`
- `POST /api/mobile/jobs/:jobId/photos/presign`
- `POST /api/mobile/jobs/:jobId/photos`
- `POST /api/mobile/jobs/:jobId/draft`
- `POST /api/mobile/jobs/:jobId/submit`

### Auth
Mobile routes accept either:
- **Clerk session (cookie-based)**: works for web/testing.
- **API key mode (for companion app/dev)**:
  - `x-mobile-api-key: <MOBILE_API_KEY>`
  - `x-mobile-user-id: <users.id>`

See `src/lib/mobile/auth.ts`.

### Storage (presigned upload)
Presigning is implemented in `src/lib/mobile/storage/s3.ts` using AWS SDK v3.

Required env vars:
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_BUCKET`
- `S3_PUBLIC_BASE_URL` (base public URL for reads, e.g. `https://cdn.example.com`)

Optional:
- `S3_REGION` (defaults to `auto`)
- `S3_ENDPOINT` (for R2/Supabase Storage gateways/S3 compatible endpoints)
- `S3_FORCE_PATH_STYLE` (`true`/`false`)

### DB tables (Drizzle)
Defined in `shared/schema.ts`:
- `mobile_jobs`
- `mobile_job_photos`
- `mobile_job_drafts`

Drafts store a JSON `payload` (line items, confidence, questions) and can be linked to a created proposal via `proposalId`.

### Draft + pricing pipeline
- Draft generation: `src/lib/mobile/draft/pipeline.ts`
- Simple pricing: `src/lib/mobile/draft/pricebook.ts`

v1 uses:
- template `baseScope` + `aiService.enhanceScope()`
- template base pricing + user/trade multipliers + job size factor

(“Vision → structured findings JSON”) is intentionally stubbed as a future layer; photos are still required to keep the user experience consistent.
