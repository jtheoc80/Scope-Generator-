# Folder: `refs/`

## Purpose

This folder contains **Git reference pointers** that are part of the Git object database backup. References point to specific commits by their SHA-1 hash.

## Contents

```
refs/
├── heads/
│   ├── main              → Points to main branch commit
│   └── replit-agent      → Points to replit-agent branch commit
├── remotes/
│   └── gitsafe-backup/
│       └── main          → Remote tracking reference
└── replit/
    └── agent-ledger      → Replit agent metadata
```

## Reference Types

| Type | Path | Description |
|------|------|-------------|
| **Local branches** | `heads/*` | Current branch HEADs |
| **Remote tracking** | `remotes/*` | Remote branch references |
| **Custom refs** | `replit/*` | Platform-specific references |

## Technical Details

- **Format**: Plain text files containing 40-character SHA-1 hashes
- **Example content**: `4fd62b7a0eb973729b363872d4e12f664e3a8602`
- **Purpose**: Maps branch names to commit objects

## Used By

- Git internals (branch resolution)
- Backup restoration processes
- Repository state management

## Safe to Delete?

❌ **No** — This folder is essential for understanding the Git object database structure.

Without `refs/`:
- Cannot determine which commits are branch tips
- Cannot restore repository state properly
- Lose branch name mappings

## Constraints

- **Do not modify** — These files point to specific commits
- **Do not rename** — Git expects this exact structure
- Part of the Git object database backup (alongside `00/`–`ff/` folders)

## Related

- [FOLDERS.md](../FOLDERS.md) — Complete folder documentation
- Object folders: `00/`, `01/`, ... `ff/` — Contain the actual commit data
- `.git/refs/` — The actual repository refs (separate from this backup)

---

*This folder is auto-documented. See [FOLDERS.md](../FOLDERS.md) for details.*
