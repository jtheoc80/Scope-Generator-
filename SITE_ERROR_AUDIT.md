# Site Error Audit Report

**Date:** February 10, 2026  
**Project:** ScopeGen (scope-generator)  
**Framework:** Next.js 15.5.9 / React 19 / TypeScript 5.9.3

---

## Summary

The build completes successfully and TypeScript compilation passes with zero type errors. However, the audit identified **several categories of runtime and structural errors** that will cause broken pages, 404s, and failed API calls for users.

---

## Critical Errors (Will Break User Experience)

### 1. Broken Internal Links — 3 Missing Routes

These links exist in the navigation/UI but point to pages that **do not exist**, resulting in 404 errors for users.

| Broken Link | Where It Appears | Impact |
|---|---|---|
| `/search-console` | `components/layout.tsx` (lines 98, 250) | Sidebar nav link → 404 |
| `/crew` | `components/layout.tsx` (lines 125, 266), `components/dashboard/PageHeader.tsx` (line 123), `app/invite/[token]/page.tsx` (line 92), `app/pro/page.tsx` (line 49) | Nav, dashboard header, invite redirect, pro redirect → 404 |
| `/scopescan/demo` | `components/homepage-scope-scan.tsx` (line 164), `app/scopescan/page.tsx` (lines 150, 265) | Homepage CTA button, ScopeScan page CTAs → 404 |

**Impact:** Users clicking these links see a 404 page. The `/crew` route is particularly critical because users are **programmatically redirected** there after accepting team invitations and after Stripe checkout on the Pro page.

### 2. Missing API Routes — 3 Frontend Fetches With No Backend

The frontend makes `fetch()` calls to these API endpoints, but no corresponding `route.ts` files exist.

| Missing API Route | Called From | What Happens |
|---|---|---|
| `/api/invite/[token]` | `app/invite/[token]/page.tsx` (line 53) | Invite info fetch returns 404 → page shows "Failed to load invite information" error |
| `/api/invite/[token]/accept` | `app/invite/[token]/page.tsx` (line 80) | Accept invite POST returns 404 → toast error "Failed to accept invite" |
| `/api/analytics/pricing-summary` | `app/pricing-insights/page.tsx` (line 91) | React Query fetch fails → pricing summary never loads for Pro users |
| `/api/analytics/benchmarks` | `app/pricing-insights/page.tsx` (line 101) | React Query fetch fails → benchmarks tab shows infinite spinner |

**Impact:** The entire **Invite flow is completely non-functional** — users cannot view or accept team invitations. The **Pricing Insights page** (a paid Pro feature) shows spinners/errors for two of its tabs.

### 3. Unsafe Non-Null Assertions on Environment Variables

These locations use `process.env.VAR!` (non-null assertion) which will crash at runtime if the env var is not set. Unlike other env vars in the project that use graceful fallbacks, these will throw unhandled exceptions.

| File | Line | Variable |
|---|---|---|
| `lib/services/photoStorage.ts` | 26 | `process.env.S3_BUCKET!` |
| `lib/services/stripeClient.ts` | 98 | `process.env.DATABASE_URL!` |
| `app/api/proposals/[id]/photos/route.ts` | 45 | `process.env.S3_BUCKET!` |
| `app/api/photo-sessions/[sessionId]/upload/route.ts` | 200-201 | `process.env.S3_BUCKET!`, `process.env.S3_PUBLIC_BASE_URL!` |
| `app/api/mobile/jobs/[jobId]/photos/upload/route.ts` | 99-100 | `process.env.S3_BUCKET!`, `process.env.S3_PUBLIC_BASE_URL!` |

**Impact:** If S3 or DATABASE_URL env vars are missing in any deployment, photo uploads, photo sessions, and Stripe operations will crash with unhandled `TypeError: Cannot read properties of undefined`.

---

## High Severity Issues

### 4. React Hook Dependency Warning (Stale Closure Risk)

ESLint flagged a genuine missing dependency in `app/dashboard/page.tsx` line 338:

```
React Hook useEffect has a missing dependency: 'queryClient'. 
Either include it or remove the dependency array.
```

This `useEffect` handles payment success/cancel URL params and calls `refetch`, but `queryClient` is not in the dependency array. This can cause stale closures where the query client reference is outdated after re-renders.

Similarly, `app/m/(authed)/issues/[jobId]/page.tsx` line 101:

```
React Hook useEffect has a missing dependency: 'LOADING_TIPS.length'.
```

### 5. Unescaped Entity Warning

`app/settings/page.tsx` line 689 uses a raw apostrophe (`You'll`) that should be `You&apos;ll`:

```
react/no-unescaped-entities: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`
```

This can cause rendering inconsistencies in certain environments.

---

## Medium Severity Issues

### 6. ESLint Warnings — 40+ Unused Variables/Imports

The linter flagged numerous unused variables and imports across the codebase. While these don't cause runtime errors, they indicate dead code and increase bundle size unnecessarily.

**Most affected files:**
- `app/calculator/page.tsx` — 12 unused imports (HomeIcon, TreePine, Share2, Copy, Check, Twitter, Facebook, Linkedin, Code, copied, setCopied, embedCopied, setEmbedCopied)
- `app/dashboard/page.tsx` — 4 unused imports (Lock, Unlock, Loader2, statsLoading)
- `app/generator/generator-client.tsx` — 4 unused (Lock, html2canvas, queryClient, billingStatus)
- `app/app/page.tsx` — 2 unused (Lock, billingStatus)
- `app/settings/page.tsx` — 2 unused (Users, refetch)
- `components/delete-account-modal.tsx` — 2 unused (AlertDialogAction, router)

### 7. Suppressed eslint-disable for React Hook Dependencies (6 locations)

These locations deliberately suppress the `react-hooks/exhaustive-deps` rule. While intentional, each is a potential source of stale state bugs:

| File | Line |
|---|---|
| `components/proposal-photo-upload.tsx` | 412 |
| `app/m/(authed)/capture/[jobId]/page.tsx` | 269 |
| `app/invite/[token]/page.tsx` | 46 |
| `components/smart-pricing-suggestion.tsx` | 110 |
| `components/smart-scope-suggestions.tsx` | 87 |
| `app/page.tsx` | 135 |

### 8. No `loading.tsx` Error Boundaries

The app has **zero** `loading.tsx` files across all routes. While the root `error.tsx` and `global-error.tsx` exist, no route-level loading states are defined. This means:
- Users see no loading indicator during server-side page navigation
- Long-loading pages (generator, dashboard, proposals) appear blank during data fetching

---

## Low Severity / Informational

### 9. `dangerouslySetInnerHTML` Usage (16 locations)

Most are for JSON-LD structured data (safe by construction since they `JSON.stringify()` controlled data). The blog content renderer in `app/blog/[slug]/page.tsx` uses it for markdown-to-HTML conversion but properly sanitizes through `processMarkdownToSafeHtml()`.

### 10. `next.config.ts` Has No Image Domain Configuration

External images would fail with Next.js `Image` component, but currently all `Image` sources appear to use local paths (`/public/`), so no issue at present. If external image URLs are added later (e.g., user-uploaded photos from S3), this config will need updating.

### 11. Build Succeeds Without Issues

The production build (`next build`) completes successfully with zero errors. All routes compile and bundle correctly.

---

## Recommended Priority Order

1. **Create missing routes** for `/crew`, `/search-console`, `/scopescan/demo` (or remove/update the links)
2. **Create missing API routes** for `/api/invite/[token]`, `/api/analytics/pricing-summary`, `/api/analytics/benchmarks` (or remove the frontend calls)
3. **Replace non-null assertions** on env vars with proper null checks and error responses
4. **Fix the useEffect dependency** in dashboard page
5. **Fix the unescaped entity** in settings page
6. **Clean up unused imports** across the flagged files
7. **Add `loading.tsx`** files for key routes (dashboard, generator, proposals)
