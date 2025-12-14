# Copilot Instructions for Scope Generator

## Project Overview
Scope Generator is a Next.js application that helps users generate professional project scopes and proposals. The application features AI-powered scope generation, payment processing, email delivery, and comprehensive proposal management.

## Tech Stack
- **Framework**: Next.js 15.5.9 (App Router)
- **Language**: TypeScript (strict mode)
- **UI Components**: Radix UI primitives with custom components
- **Styling**: Tailwind CSS v4
- **Authentication**: Currently disabled (Clerk was removed due to Edge Function bundling incompatibility)
- **Database**: PostgreSQL with Drizzle ORM
- **Payments**: Stripe
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form with Zod validation
- **Animation**: Framer Motion
- **Email**: Mailgun
- **External APIs**: 1Build API for construction data

## Project Structure

```
/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   ├── not-found.tsx       # 404 page
│   └── globals.css         # Global styles with Tailwind v4
├── components/             # React components
│   ├── ui/                 # Radix UI-based components (35+ components)
│   └── *.tsx               # Custom components (modals, layouts, widgets)
├── lib/                    # Utilities and services
│   ├── db.ts               # Database connection
│   ├── schema.ts           # Drizzle schema definitions
│   ├── services/           # Service layer
│   │   ├── aiService.ts
│   │   ├── emailService.ts
│   │   ├── stripeService.ts
│   │   ├── stripeClient.ts
│   │   ├── webhookHandlers.ts
│   │   ├── onebuild.ts
│   │   ├── storage.ts
│   │   └── searchConsole.ts
│   ├── proposal-data.ts    # Proposal templates and data
│   ├── regional-pricing.ts # Regional pricing data
│   ├── translations.ts     # i18n translations
│   └── utils.ts            # Utility functions
├── hooks/                  # Custom React hooks
│   ├── use-toast.ts
│   ├── use-cost-data.ts
│   ├── use-analytics.tsx
│   ├── use-mobile.tsx
│   ├── useAuth.ts
│   └── useLanguage.tsx
├── middleware.ts           # Authentication middleware (currently disabled)
├── pages-to-convert/       # Legacy pages from Vite migration (not yet converted)
├── api-to-convert/         # Legacy Express routes (not yet converted)
├── server/                 # Legacy server code (not currently used)
└── shared/                 # Shared utilities
```

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Drizzle Studio

## Coding Conventions

### TypeScript
- Use strict TypeScript mode
- Define types explicitly; avoid `any`
- Use interfaces for object shapes, types for unions/intersections
- Path aliases: Use `@/` prefix for imports (e.g., `@/lib/utils`, `@/components/ui/button`)
  - Currently resolves to root-level directories (`app/`, `components/`, `lib/`, etc.)

### React Components
- Use functional components with TypeScript
- Add `'use client'` directive for client-side interactive components
- Server components by default (App Router)
- Component naming: PascalCase for files and exports
- Props interfaces: `ComponentNameProps`

### File Organization
- One component per file
- Co-locate related files (components, styles, tests)
- Index files for barrel exports when needed
- Keep components focused and single-responsibility

### Styling
- Use Tailwind CSS utility classes
- Use `cn()` utility from `lib/utils.ts` for conditional classes
- Follow mobile-first responsive design
- Use CSS variables for theme customization
- **Prefer semantic color variables** (text-foreground, text-muted-foreground, bg-background, bg-card) over hardcoded Tailwind colors (text-gray-900, bg-gray-50)
- The app uses Tailwind CSS v4 with `@theme inline` syntax in globals.css

### Database
- Use Drizzle ORM for all database operations
- Schema defined in `lib/schema.ts`
- Use parameterized queries to prevent SQL injection
- Handle database errors gracefully

### Authentication
- Authentication is currently disabled (Clerk was removed due to Edge Function bundling incompatibility with Next.js 15)
- The middleware.ts file exists but does not enforce authentication
- For future implementations, consider alternative authentication solutions compatible with Next.js Edge Runtime
- Legacy auth hooks (useAuth.ts) exist but are not actively used

### API Routes
- Place in `app/api/` directory
- Export named functions: `GET`, `POST`, `PUT`, `DELETE`
- Use `NextResponse` for responses
- Validate input with Zod schemas
- Return appropriate HTTP status codes
- **Note:** Most API routes are currently in legacy `api-to-convert/routes.ts` and need conversion to Next.js API routes

### Forms
- Use React Hook Form for form state
- Zod schemas for validation
- Use resolver from `@hookform/resolvers/zod`
- Provide clear error messages

### State Management
- TanStack Query for server state
- React hooks for local state
- Context for shared UI state when needed
- Avoid prop drilling

### Error Handling
- Use try-catch blocks for async operations
- Log errors appropriately
- Provide user-friendly error messages
- Handle edge cases

## Environment Variables

Required environment variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string (Neon or Supabase)
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (for webhook signature verification)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key
- `MAILGUN_API_KEY` - Mailgun API key (optional for email functionality)
- `MAILGUN_DOMAIN` - Mailgun domain (optional for email functionality)
- `ONEBUILD_EXTERNAL_KEY` - 1Build API key (optional for market pricing)

## Common Patterns

### Server Actions
Use server actions for mutations from client components:
```typescript
'use server'

export async function createProposal(data: ProposalData) {
  // Add authentication check when auth is re-enabled
  
  // Database operation
  return await db.insert(proposals).values(data)
}
```

### Client Components with Server Data
```typescript
'use client'

import { useQuery } from '@tanstack/react-query'

export function ProposalList() {
  const { data, isLoading } = useQuery({
    queryKey: ['proposals'],
    queryFn: async () => {
      const res = await fetch('/api/proposals')
      return res.json()
    }
  })
  
  // Render logic
}
```

### Modal Patterns
Use Radix UI Dialog for modals with consistent styling from `components/ui/dialog.tsx`

### Payment Flow
1. Create checkout session via Stripe service
2. Redirect to Stripe Checkout
3. Handle webhook for successful payments
4. Update database with subscription status

## Testing
- Currently no test suite configured
- Manual testing required for all changes
- Test authentication flows thoroughly
- Verify payment integrations in test mode

## Deployment
- Deployed on Vercel
- Automatic deployments from main branch
- Preview deployments for pull requests
- Environment variables configured in Vercel dashboard

## Migration Notes
This project was migrated from a React + Vite + Replit setup to Next.js + Vercel. See `MIGRATION_GUIDE.md` for historical context. 

**Important Migration Status:**
- The migration is **partially complete**
- The Next.js app structure exists with basic layout and home page
- Many legacy files remain in `pages-to-convert/`, `api-to-convert/`, and `server/` directories
- These legacy files are **excluded from TypeScript compilation** (see tsconfig.json)
- The app currently uses a minimal Next.js setup with only the home page converted
- When working on this project, be aware that some patterns and files may be legacy artifacts

## Best Practices
- Follow Next.js App Router conventions
- Use Server Components by default, Client Components when needed
- Optimize images with `next/image`
  - **Important:** Use `unoptimized={true}` prop when rendering base64 data URLs
- Use proper loading and error states
- Implement accessibility features (ARIA labels, keyboard navigation)
- Keep bundle size minimal
- Follow security best practices (sanitize inputs, validate on server)
- Use semantic HTML
- Write descriptive commit messages
- Use `next/link` Link component instead of anchor tags for internal navigation
- For type assertions that bypass TypeScript safety, add detailed inline comments with rationale and TODO notes

## Common Issues & Gotchas

### TypeScript Configuration
- Use `jsx: "preserve"` in tsconfig.json for Next.js App Router (SWC handles JSX transformation)
- Path aliases use `@/` prefix which resolves to root-level directories

### Error Handling
- Use Zod's built-in error messages instead of external validation error libraries
- Always use try-catch blocks for async operations

### Build Considerations
- Next.js 15.5.9 is used (not 16.x) due to Edge Function bundling compatibility
- Clerk authentication was removed due to Edge Function bundling issues with node-only modules
- When adding external packages, verify Edge Runtime compatibility if using middleware
