# Legacy Server Directory

> **Status**: LEGACY - This directory contains code from the original Express/Vite architecture before the Next.js migration.

## Overview

This directory was part of the original Express backend server. Most functionality has been migrated to Next.js API routes and the `lib/services/` directory.

## Files Still In Use

The following files are **still actively used** via re-exports or direct imports:

| File | Status | Used By |
|------|--------|---------|
| `db.ts` | **Active** | Re-exported via `lib/services/db.ts`, used by 30+ API routes |
| `storage.ts` | **Active** | Re-exported via `lib/services/storage.ts`, provides data access layer |

## Duplicate Files (Should NOT Be Used)

These files have active counterparts in `lib/services/` and should not be imported directly:

| Legacy File | Active File | Notes |
|-------------|-------------|-------|
| `services/onebuild.ts` | `lib/services/onebuild.ts` | Different implementations - use lib/ version |
| `services/searchConsole.ts` | `lib/services/searchConsole.ts` | Identical - use lib/ version |
| `webhookHandlers.ts` | `lib/services/webhookHandlers.ts` | Similar - use lib/ version |
| `aiService.ts` | `lib/services/aiService.ts` | Similar - use lib/ version |
| `stripeClient.ts` | `lib/services/stripeClient.ts` | Similar - use lib/ version |

## Migration Guide

When adding new database-related code:

1. **Import db from** `@/lib/db` (preferred) or `@/lib/services/db`
2. **Do NOT import from** `@/server/db` directly in new code
3. **Storage methods**: Use `@/lib/services/storage`

## Excluded From TypeScript

This directory is excluded from TypeScript compilation in `tsconfig.json`. Files here are only checked at runtime.

## Future Cleanup

Once all imports are migrated:
1. Move `storage.ts` functionality to `lib/services/storage.ts`
2. Remove duplicate service files
3. Archive or delete this directory

---
*Last updated: January 2026*
