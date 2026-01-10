# Folder Directory for ScopeGen Repository

This document provides a reference for all folders at the repository root, with special attention to the numeric/hexadecimal folders that may appear cryptic at first glance.

---

## Quick Navigation

- [Overview](#overview)
- [Git Object Folders (00–ff)](#git-object-folders-00ff)
- [Application Folders](#application-folders)
- [FAQ](#faq)

---

## Overview

Some older snapshots of this repository included **248 hexadecimal-named folders** (`00`, `01`, `02`, ... `fe`, `ff`) plus a top-level `refs/` folder. Those were an extracted copy of `.git/objects` + `.git/refs` that had been committed as “backup data”.

**They are not required for normal development**, because the real Git object database already exists inside the actual `.git/` directory. Keeping them in the repo root increases clone size, slows down tooling, and adds maintenance risk, so they should remain **out of version control**.

---

## Git Object Folders (00–ff)

### Summary

| Attribute | Value |
|-----------|-------|
| **Pattern** | Two-character hexadecimal names (`00`–`ff`) |
| **Count** | 248 folders |
| **Total Objects** | ~2,324 files |
| **Content Type** | zlib-compressed Git objects |
| **Purpose** | Legacy git object database backup (do not commit) |
| **Used By** | Not used by the application |
| **Safe to Delete?** | ✅ Yes (from the repository working tree) |

### Folder Reference Table

| Folder | Purpose | Contents | Used By | Notes |
|--------|---------|----------|---------|-------|
| `00`–`ff` | Legacy backup data | zlib-compressed blobs, trees, commits | None (keep out of repo) | SHA-1 hash prefixes |
| `refs/` | Legacy backup data | Branch pointers | None (keep out of repo) | Duplicates `.git/refs` |

### What These Folders Contain

Each hexadecimal folder stores **Git objects** whose SHA-1 hash starts with that two-character prefix:

1. **Blob Objects** — File contents (source code, images, configs)
2. **Tree Objects** — Directory structures (file listings)
3. **Commit Objects** — Commit metadata (author, message, parent)

**Example structure:**
```
00/
├── 2a0cc1e414b54ad9cc2c1d4854d813025e4f51  (commit object)
├── a79e59df4cddd3cdc862fa4e9f0218b9fb4782  (tree object)
└── ...
```

The full SHA-1 is: `00` + filename (e.g., `002a0cc1e414b54ad9cc2c1d4854d813025e4f51`)

### Complete List of Git Object Folders

<details>
<summary>Click to expand all 248 folders</summary>

```
00  01  02  03  04  05  06  07  08  09  0a  0b  0c  0d  0e  0f
10  11  12  13  14  15  16  17  18  19  1a  1b  1c  1d  1e  1f
20  21  22  23  24  25  26  27  28  29  2a  2c  2d  2e  2f
30  31  32  33  34  35  36  37  38  39  3a  3b  3c  3d  3e  3f
40  41  42  43  44  45  46  47  48  49  4a  4b  4c  4d  4e  4f
50  51  52  53  54  55  56  57  58  59  5a  5b  5c  5d  5f
60  61  62  63  64  65  66  67  68  69  6a  6b  6c  6d  6e  6f
70  71  72  73  74  75  76  77  78  79  7a  7b  7c  7d  7e  7f
80  81  82  83  84  85  86  87  88  89  8a  8b  8c  8d  8e  8f
90  91  92  94  95  96  97  98  99  9a  9b  9c  9d  9e  9f
a0  a1  a2  a3  a4  a5  a6  a7  a8  a9  aa  ab  ac  ad  ae
b0  b1  b2  b3  b4  b5  b6  b7  b8  b9  ba  bb  bc  bd  be  bf
c0  c1  c2  c3  c4  c5  c6  c7  c8  c9  ca  cb  cc  cd  ce  cf
d0  d1  d4  d5  d6  d7  d8  d9  da  db  dd  de  df
e0  e1  e2  e3  e4  e5  e6  e7  e8  ea  eb  ec  ed  ee  ef
f0  f1  f2  f3  f4  f5  f6  f7  f8  f9  fa  fb  fc  fd  fe  ff
```

Missing folders: `2b`, `5e`, `93`, `af`, `d2`, `d3`, `dc`, `e9` (no objects with these prefixes)

</details>

---

## Application Folders

| Folder | Purpose | Contents | Used By | Notes |
|--------|---------|----------|---------|-------|
| `app/` | Next.js App Router | Pages, API routes, layouts | Build, Runtime | Main application code |
| `apps/` | Additional applications | Sub-apps or workspaces | Build | Monorepo structure |
| `components/` | React components | UI components | Build, App | Shared across pages |
| `hooks/` | Custom React hooks | useX hooks | App | State & logic hooks |
| `lib/` | Utilities & config | Schema, helpers, config | Build, App | Core libraries |
| `src/` | Source code | Business logic | Build, App | Core features |
| `server/` | Server-side code | API handlers | Runtime | Backend logic |
| `shared/` | Shared modules | Cross-app code | Build, App | Common utilities |
| `state/` | State management | Stores, reducers | App | Global state |
| `public/` | Static assets | Images, fonts | Build, Runtime | Served directly |
| `drizzle/` | Database | Migrations, schema | Build, DB | PostgreSQL with Drizzle |
| `supabase/` | Supabase config | DB config | Build, DB | Alternative DB setup |
| `scripts/` | Build scripts | Automation | Build, CI | npm scripts |
| `script/` | Additional scripts | Utilities | Dev | Helper scripts |
| `tests/` | Test files | E2E, unit tests | CI, Dev | Playwright tests |
| `qa/` | QA automation | QA scripts | CI, QA | Quality assurance |
| `docs/` | Documentation | Guides, API docs | Dev | Project docs |
| `build-logs/` | Build output | CI logs | CI | Build artifacts |
| `.github/` | GitHub config | Workflows, templates | GitHub Actions | CI/CD config |
| `api-to-convert/` | API migration | Old API code | Migration | Legacy code |
| `pages-to-convert/` | Pages migration | Old pages | Migration | Legacy code |
| `nextjs-app/` | Next.js app | App variant | Build | Alternative app |
| `create-next-app-nodejs/` | Template | Starter template | Dev | Project template |

---

## FAQ

### Why are there so many numbered folders?

These are **Git object storage folders**, not application data. Git uses the first two characters of each SHA-1 hash as a folder name to organize objects efficiently.

### Can I delete the numbered folders?

Yes — **from the repository working tree**. The authoritative Git history is stored in `.git/` as usual.

If you need a portable backup of repository history, prefer standard Git mechanisms like `git bundle` or a remote mirror instead of committing `.git/objects` into the repo.

### What's in the `refs/` folder?

The `refs/` folder contains branch pointers:
- `refs/heads/main` — Points to the main branch commit
- `refs/heads/replit-agent` — Points to the replit-agent branch
- `refs/remotes/` — Remote tracking branches

### How were these folders created?

These appear to have been an extracted `.git/objects/` directory (plus refs) that was mistakenly committed, possibly as a backup mechanism or from a Git hosting tool.

---

## Related Documentation

- [Project README](./README.md) — Getting started guide
- [API Documentation](./docs/) — API reference
- [Database Schema](./lib/schema.ts) — Database structure

---

*Last updated: January 2026*
