# Copilot Instructions for Scope Generator

## Project Overview
Scope Generator is a Next.js application that helps users generate professional project scopes and proposals. The application features AI-powered scope generation, payment processing, email delivery, and comprehensive proposal management.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **UI Components**: Radix UI primitives with custom components
- **Styling**: Tailwind CSS v4
- **Authentication**: Clerk
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
│   ├── layout.tsx          # Root layout with Clerk provider
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
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
│   │   └── onebuild.ts
│   └── utils.ts            # Utility functions
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript type definitions
└── middleware.ts           # Clerk authentication middleware
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

### Database
- Use Drizzle ORM for all database operations
- Schema defined in `lib/schema.ts`
- Use parameterized queries to prevent SQL injection
- Handle database errors gracefully

### Authentication
- Use Clerk for authentication
- Protected routes via middleware
- Use `auth()` for server components
- Use `useUser()` hook for client components
- Check authentication status before operations

### API Routes
- Place in `app/api/` directory
- Export named functions: `GET`, `POST`, `PUT`, `DELETE`
- Use `NextResponse` for responses
- Validate input with Zod schemas
- Return appropriate HTTP status codes

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
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key
- `MAILGUN_API_KEY` - Mailgun API key
- `ONEBUILD_EXTERNAL_KEY` - 1Build API key (optional)

## Common Patterns

### Server Actions
Use server actions for mutations from client components:
```typescript
'use server'

export async function createProposal(data: ProposalData) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')
  
  // Database operation
  return await db.insert(proposals).values({ ...data, userId })
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
This project was migrated from a React + Vite + Replit setup to Next.js + Vercel. See `MIGRATION_GUIDE.md` for historical context. Some legacy patterns may still exist in the codebase.

## Best Practices
- Follow Next.js App Router conventions
- Use Server Components by default, Client Components when needed
- Optimize images with `next/image`
- Use proper loading and error states
- Implement accessibility features (ARIA labels, keyboard navigation)
- Keep bundle size minimal
- Follow security best practices (sanitize inputs, validate on server)
- Use semantic HTML
- Write descriptive commit messages
