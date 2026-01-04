# Folder: `86/`

## Purpose

This folder is part of a **Git object database** backup. It contains Git objects whose SHA-1 hash begins with `86`.

## Contents

| Type | Description |
|------|-------------|
| **Blob objects** | Compressed file contents |
| **Tree objects** | Directory structure snapshots |
| **Commit objects** | Commit metadata and history |

## Technical Details

- **Format**: zlib-compressed Git objects
- **Naming**: SHA-1 hash with `86` prefix removed (full hash = `86` + filename)
- **Encoding**: Binary (not human-readable without decompression)

## Used By

- Git internals (if this database is used for restoration)
- Backup/audit processes
- Repository history analysis tools

## Safe to Delete?

❌ **No** — This folder contains repository history and backup data.

Deleting may result in:
- Loss of historical commits
- Inability to restore from this backup
- Missing file versions

## Constraints

- **Do not modify** — These are integrity-checked Git objects
- **Do not rename** — Folder name (`86`) is part of the SHA-1 addressing scheme
- Part of 248 similar folders (`00`–`ff`) forming a complete Git object database

## Related

- [FOLDERS.md](../FOLDERS.md) — Complete folder documentation
- `refs/` — Branch reference pointers

---

*This folder is auto-documented. See [FOLDERS.md](../FOLDERS.md) for details.*
