# ScopeGen - Professional Contractor Proposals

## Overview

ScopeGen is a web application designed to help small contractors (bathroom remodelers, painters, HVAC specialists, etc.) generate professional proposals and scopes of work in seconds. The application streamlines the proposal creation process by providing pre-built templates with customizable options, eliminating the need for contractors to write detailed scopes manually. The platform includes a freemium model with basic preview functionality and a paid "Pro" tier for full access to proposals.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool and development server.

**Routing**: Wouter is used for client-side routing, providing a lightweight alternative to React Router.

**UI Components**: The application uses shadcn/ui component library with Radix UI primitives, styled with Tailwind CSS. This provides a consistent, accessible, and customizable design system with the "new-york" style variant.

**State Management**: TanStack Query (React Query) handles server state management, caching, and data fetching. Form state is managed using React Hook Form with Zod for validation.

**Styling**: Tailwind CSS v4 with a custom industrial/professional color palette featuring navy primary colors and safety orange accents. Custom fonts include Inter for body text and Barlow Condensed for headings.

**Key Pages**:
- Home/Landing page with hero section and marketing content
- Generator page with multi-step form for proposal creation
- Dashboard for viewing and managing saved proposals

### Backend Architecture

**Runtime**: Node.js with Express.js framework handling HTTP requests.

**Language**: TypeScript throughout the entire stack (shared types between client and server).

**Authentication**: Replit Auth (OpenID Connect) with Passport.js strategy for user authentication. Sessions are managed using express-session with PostgreSQL session storage.

**API Design**: RESTful API endpoints organized in a centralized routes file. The server uses conventional HTTP methods and returns JSON responses.

**Data Validation**: Zod schemas are used for runtime validation of incoming requests and shared between client and server for type safety.

**Build Process**: Custom build script using esbuild for server bundling and Vite for client bundling. The build process optimizes by bundling frequently-used dependencies to reduce cold start times.

### Data Storage

**Database**: PostgreSQL managed through Drizzle ORM with schema-first design.

**Schema Design**:
- `users` table: Stores user profiles with Replit Auth integration and Stripe customer information
- `proposals` table: Stores generated proposals with client information, job details, pricing, and unlock status
- `sessions` table: PostgreSQL-backed session storage for authentication

**ORM Features**: Drizzle provides type-safe database queries and automatic schema migrations. The schema is defined in TypeScript and generates Zod validators for runtime validation.

**Session Storage**: Uses connect-pg-simple to store Express sessions in PostgreSQL instead of in-memory storage, enabling persistence across server restarts.

### Payment Processing

**Stripe Integration**: Full Stripe integration using stripe-replit-sync for managed webhooks and automatic data synchronization.

**Payment Features**:
- Checkout Sessions for subscription purchases
- Customer Portal for subscription management
- Webhook handling for payment events (checkout completion, subscription updates/cancellations)
- Product and price management synced to local database

**Subscription Model**: Pro tier subscription with monthly ($29) and yearly ($249) pricing options. Free tier allows preview of proposals with blurred/limited content.

**Data Sync**: Stripe data (products, prices, customers, subscriptions) is synchronized to a local `stripe` schema in PostgreSQL for efficient querying without constant API calls.

### External Dependencies

**Replit Platform Services**:
- Replit Auth (OIDC) for authentication
- Replit Connectors for Stripe credentials management
- Replit-specific environment variables for deployment URLs and identity tokens

**Third-Party APIs**:
- Stripe API for payment processing and subscription management
- Stripe webhook endpoints for event handling

**Cloud Services**:
- PostgreSQL database (expected to be provisioned via DATABASE_URL environment variable)

**Development Tools**:
- Replit Vite plugins for development experience (cartographer, dev banner, runtime error modal)
- Custom Vite plugin for meta image URL updates based on deployment domain

**PDF Generation**: Client-side PDF generation using html2canvas and jsPDF to convert proposal previews into downloadable documents.

**Email Service**: Mailgun integration for sending proposal emails to clients. Uses `mailgun.js` library with the following features:
- Send formatted HTML/text proposal emails to clients
- Connection test endpoint (`GET /api/email/test`)
- Send proposal endpoint (`POST /api/proposals/:id/email`)
- Professional email templates with company branding
- Required secrets: `MAILGUN_API_KEY` and `MAILGUN_DOMAIN`

**1build Cost Data Integration**: Server-side integration with 1build.com API for real-time construction cost data. Uses GraphQL queries to fetch material costs, labor rates, and equipment pricing by location (county-level across 3,000+ US counties).
- Service: `server/services/onebuild.ts` - GraphQL client for 1build external API
- API Routes:
  - `GET /api/costs/status` - Check if external API is configured
  - `GET /api/costs/search` - Search costs by term, zipcode, and type (MATERIAL/LABOR/EQUIPMENT/ASSEMBLY)
  - `GET /api/costs/material` - Get specific material cost by name and zipcode
  - `GET /api/costs/labor` - Get labor rates by trade type and zipcode
  - `GET /api/costs/trade` - Get combined materials + labor pricing for a trade
- Frontend Hooks: `client/src/hooks/use-cost-data.ts` - React Query hooks for consuming cost data
- Required secret: `ONEBUILD_EXTERNAL_KEY` (server-side external API key from 1build - contact help@1build.com for access)
- Note: Different from `ONEBUILD_API_KEY` which is the embedded widget key with referrer restrictions

**Asset Management**: Static assets served from attached_assets directory with Vite alias configuration.