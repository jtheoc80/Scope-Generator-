# Technical Debt & TODO Tracking

This document tracks incomplete features, technical debt, and planned improvements identified during code audits.

---

## 🔴 High Priority

### Learning System - Incomplete Features

| Location | Description | Status |
|----------|-------------|--------|
| `src/lib/learning/learning-service.ts:640` | Implement option learning for `preferredOptions` | TODO |
| `src/lib/learning/learning-service.ts:656` | Implement pattern aggregation logic | TODO |
| `src/lib/learning/recommendation-engine.ts:389` | Implement competitor analysis for `competitorRange` | TODO |
| `src/lib/learning/recommendation-engine.ts:459` | Implement option recommendations | TODO |

### Storage Layer

| Location | Description | Status |
|----------|-------------|--------|
| `server/storage.ts:276` | Add explicit `isCover` field and richer tags for photo categorization | TODO |

---

## 🟡 Medium Priority

### Console.log Migration

The codebase has ~177 console.log/error/warn statements in API routes that should be migrated to the structured logger (`@/lib/logger`).

**Pattern to replace:**
```typescript
// Before
console.log('Message', data);
console.error('Error:', error);

// After
import { logger } from '@/lib/logger';
logger.info('Message', { data });
logger.error('Error occurred', error);
```

**Files with highest counts:**
- `app/api/webhooks/eagleview/route.ts` (14 occurrences)
- `app/api/stripe/webhook/route.ts` (11 occurrences)
- `app/api/mobile/jobs/[jobId]/submit/route.ts` (7 occurrences)
- `app/api/photo-sessions/[sessionId]/upload/route.ts` (7 occurrences)

---

## 🟢 Low Priority / Future Enhancements

### Security Enhancements

1. **Database SSL Certificates**: For maximum security, deploy with `DB_SSL_CA` environment variable containing the database CA certificate. This enables proper certificate validation instead of `rejectUnauthorized: false`.

2. **Dependency Updates**: The following dev dependencies have known vulnerabilities but fixes require breaking changes:
   - `drizzle-kit` (esbuild vulnerability) - Wait for upstream fix
   - `@lhci/cli` (tmp vulnerability) - Consider alternative or wait for fix

### Code Quality

1. **Webpack Cache Warning**: Build shows `Serializing big strings (181kiB)` warning. Consider optimizing large string handling.

2. **Legacy Directories**: The following can be removed if confirmed unused:
   - `/workspace/nextjs-app/` - Alternative Next.js setup
   - `/workspace/apps/` - Mobile app prototypes

---

## ✅ Completed

| Date | Description |
|------|-------------|
| 2026-01-10 | Consolidated duplicate schema files (lib/schema.ts → @shared/schema) |
| 2026-01-10 | Improved SSL certificate validation with DB_SSL_CA support |
| 2026-01-10 | Removed legacy migration directories (pages-to-convert, api-to-convert) |
| 2026-01-10 | Fixed ESLint config anonymous export warning |

---

*Last updated: 2026-01-10*
