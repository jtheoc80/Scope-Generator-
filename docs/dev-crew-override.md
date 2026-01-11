# Dev/Staging Crew Entitlement Override

This document explains how to enable and use the dev/staging Crew entitlement override for testing Crew features without bypassing production billing.

## Purpose

The Crew subscription plan includes premium features like:
- Team workspace management
- Unlimited proposals for the team
- Google Search Console integration
- Shared company branding

When developing or testing these features locally or in staging, you need Crew access without having an actual paid subscription. This override system solves that problem safely.

## Security

**The override is COMPLETELY DISABLED in production (`NODE_ENV=production`).** There is no way for these environment variables to grant Crew access in production—the code explicitly checks for production mode and ignores overrides.

## Configuration Options

### Option 1: Email Allowlist (Recommended)

Add specific email addresses that should have Crew access in dev/staging:

```bash
DEV_CREW_EMAILS=dev@example.com,tester@company.com,qa@example.org
```

This is the recommended approach because:
- It's explicit about who gets access
- It's easy to audit
- Multiple team members can be added

### Option 2: Force Flag (Use with Caution)

Give ALL authenticated users Crew access:

```bash
DEV_FORCE_CREW=true
```

Use this only when:
- Testing locally with a single user
- You need to quickly test without configuring emails
- The environment is completely isolated (not shared staging)

## How It Works

### Architecture

The entitlement system follows a single-source-of-truth pattern:

1. **Server-side resolver** (`lib/entitlements.ts`):
   - Checks subscription plan first (real billing)
   - If not subscribed AND not in production, checks dev overrides
   - Returns structured result with access status and reason

2. **Express middleware** (`server/routes.ts`):
   - `isCrewUser` middleware uses the entitlement resolver
   - Protects Search Console and other Crew-only API routes

3. **API response** (`app/api/auth/user/route.ts`):
   - Returns `isDevCrewOverride` flag to client
   - Returns `devOverrideReason` for UI display
   - Sets `subscriptionPlan` to 'crew' when override is active

4. **Client UI** (`app/crew/page.tsx`):
   - Checks `subscriptionPlan === 'crew'` for access
   - Displays dev badge when `isDevCrewOverride` is true

### Flow Diagram

```
User Request
     │
     ▼
┌─────────────────────────────┐
│  checkCrewEntitlement()     │
│  in lib/entitlements.ts     │
└─────────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│  1. Has 'crew' subscription?│──Yes──▶ Access: subscription
│     (real billing)          │
└─────────────────────────────┘
     │No
     ▼
┌─────────────────────────────┐
│  2. NODE_ENV === 'production'│──Yes──▶ Access: denied
└─────────────────────────────┘
     │No
     ▼
┌─────────────────────────────┐
│  3. Email in DEV_CREW_EMAILS?│──Yes──▶ Access: dev_email_allowlist
└─────────────────────────────┘
     │No
     ▼
┌─────────────────────────────┐
│  4. DEV_FORCE_CREW=true?    │──Yes──▶ Access: dev_force_flag
└─────────────────────────────┘
     │No
     ▼
Access: denied
```

## UI Indicator

When the override is active, a yellow banner appears at the top of the Crew page:

```
⚙️ Dev: Crew Override Enabled (Email Allowlist)
```

or

```
⚙️ Dev: Crew Override Enabled (Force Flag)
```

This ensures developers always know when they're using override access rather than real billing.

## Files Involved

| File | Purpose |
|------|---------|
| `lib/entitlements.ts` | Core entitlement logic (single source of truth) |
| `server/routes.ts` | `isCrewUser` middleware for API protection |
| `app/api/auth/user/route.ts` | Returns override flags to client |
| `hooks/useAuth.ts` | TypeScript types for override fields |
| `app/crew/page.tsx` | UI display and dev badge |
| `.env.example` | Documentation of env vars |

## Testing

### To enable the override locally:

1. Add to your `.env` file:
   ```bash
   DEV_CREW_EMAILS=your-email@example.com
   ```

2. Restart your dev server

3. Sign in with the email in the allowlist

4. Navigate to `/crew` - you should see the dev badge and have full access

### To verify production safety:

1. Set `NODE_ENV=production` temporarily
2. Observe that neither env var grants access
3. Revert `NODE_ENV` to development

## Protected API Routes

The following API routes are protected by the Crew entitlement check:

- `/api/search-console/test`
- `/api/search-console/sites`
- `/api/search-console/analytics`
- `/api/search-console/sitemaps` (GET, POST, DELETE)
- `/api/search-console/inspect-url`

Company management routes (`/api/company/*`) are directly protected server-side by the `isCrewUser` middleware (in addition to any client-side redirects used for navigation).

## Troubleshooting

### Override not working

1. Check `NODE_ENV` is not set to `production`
2. Verify the email matches exactly (case-insensitive)
3. Ensure env vars are loaded (restart server after changes)

### Badge not showing

1. Check browser console for any errors
2. Verify `isDevCrewOverride` is returned from `/api/auth/user`
3. Clear browser cache/hard refresh

### API returns 403

1. Confirm the middleware is using `checkCrewEntitlement`
2. Check server logs for entitlement check results
3. Verify user is authenticated before checking entitlements
