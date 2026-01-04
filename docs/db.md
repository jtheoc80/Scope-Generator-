# Database Management Guide

This project uses **Drizzle ORM** with **Supabase Postgres**.

## Quick Reference

```bash
# Check database connection and schema
npm run db:check

# Generate migrations from schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Open Drizzle Studio (GUI)
npm run db:studio

# Push schema directly (for development only)
npm run db:push
```

## Environment Setup

The database connection is configured via `DATABASE_URL` environment variable.

```bash
# Example Supabase URL format:
DATABASE_URL=postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### Vercel Environment

On Vercel, set `DATABASE_URL` in:
1. Project Settings → Environment Variables
2. Configure for Production, Preview, and Development as needed

**Important:** Production and Preview environments should use different databases to avoid data conflicts.

## Migration Workflow

### 1. Making Schema Changes

Edit `shared/schema.ts` to add/modify tables or columns:

```typescript
// Example: Adding a new column
export const proposals = pgTable("proposals", {
  // ... existing columns
  newColumn: varchar("new_column").default("value"),
});
```

### 2. Generate Migration

```bash
npm run db:generate
```

This creates a new migration file in `/drizzle/migrations/`.

### 3. Review Migration

Always review generated migrations before applying:

```bash
cat drizzle/migrations/XXXX_migration_name.sql
```

### 4. Apply Migration (Local)

```bash
npm run db:migrate
```

### 5. Apply Migration (Production)

**Option A: Via Vercel Build (Recommended)**

Add to `package.json` build script:
```json
{
  "scripts": {
    "build": "npm run db:migrate && next build"
  }
}
```

**Option B: Manual (for emergency fixes)**

```bash
# Set production DATABASE_URL
export DATABASE_URL="postgres://..."
npm run db:migrate
```

## Verifying Schema

Before deploying, verify the target database has all required columns:

```bash
npm run db:check
```

This script:
- Shows which database you're connected to (with masked credentials)
- Checks for expected columns like `scope_sections`
- Returns exit code 1 if columns are missing

### CI Integration

Add to your CI pipeline:

```yaml
# .github/workflows/deploy.yml
- name: Verify database schema
  run: npm run db:check
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Common Issues

### "Column does not exist" Error

**Symptom:** API returns error like `column "scope_sections" of relation "proposals" does not exist`

**Cause:** Schema drift - code expects columns that don't exist in the database.

**Solution:**
1. Run `npm run db:check` to identify missing columns
2. Run `npm run db:migrate` to apply migrations
3. If migrations don't exist, run `npm run db:generate` first

### Identifying Which Database

If you're unsure which database your app is using:

```bash
npm run db:check
```

This shows:
- Database name
- Server address
- Supabase project reference (if applicable)

### Multiple Environments

Always verify you're targeting the correct environment:

```bash
# Check current DATABASE_URL
echo $DATABASE_URL | head -c 50

# Or use the check script
npm run db:check
```

## Migration Files

Migrations are stored in `/drizzle/migrations/`:

```
drizzle/
  migrations/
    0001_add_customer_address_memory.sql
    0002_add_photo_upload_sessions.sql
    0003_similar_job_retrieval_pgvector.sql
    0004_add_eagleview_roof_orders.sql
    0005_add_proposal_scope_sections.sql
    0006_ensure_scope_sections_not_null.sql
```

## Best Practices

1. **Always generate migrations** - Don't modify database directly
2. **Review before applying** - Check migration SQL is correct
3. **Test locally first** - Apply to dev database before production
4. **Version control migrations** - Commit all migration files
5. **Run db:check in CI** - Catch missing columns before deploy
6. **Never skip migrations** - Apply migrations before deploying code changes

## Emergency Procedures

### Rolling Back

Drizzle doesn't have automatic rollbacks. To rollback:

1. Create a new migration that reverses the change
2. Or manually run SQL in Supabase SQL Editor

### Direct Database Access

For emergency fixes:

1. Go to Supabase Dashboard → SQL Editor
2. Run your SQL manually
3. Document what was changed
4. Create a migration to match (so other environments get the change)

## Debugging

### Enable Query Logging

```typescript
// In db.ts, add logging
export const db = drizzle(pool, { 
  schema,
  logger: true  // Logs all queries
});
```

### Check Table Structure

```sql
-- In Supabase SQL Editor
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'proposals'
ORDER BY ordinal_position;
```
