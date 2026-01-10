# Mobile Companion App (Prototype)

> **Status: Design Prototype / Not Integrated**

This directory contains a React Native Expo prototype for a mobile companion app concept. It is **not currently integrated** into the main application and is excluded from the build.

## Purpose

This prototype was created to explore the concept of a mobile companion app for field contractors. The actual mobile functionality has been implemented as a **Progressive Web App (PWA)** within the main Next.js application at `/app/m/`.

## Current State

- **Not actively developed**: This code is a static prototype
- **Excluded from build**: Listed in `tsconfig.json` exclusions
- **Web-based alternative exists**: See `/app/m/` for the PWA implementation

## Web-based Mobile Features

The production mobile experience is available at:

- `/m/create` - Create new jobs from the field
- `/m/capture/[jobId]` - Capture photos for a job
- `/m/preview/[jobId]` - Preview generated proposals
- `/m/issues/[jobId]` - Review AI-identified issues

## Related Documentation

- [Instant Proposal Companion](../../docs/instant-proposal-companion.md) - Feature design document
- [Photo UX Improvements](../../docs/photo-ux-improvements.md) - Mobile photo capture UX

## Cleanup

This directory can be safely removed if the design artifacts are no longer needed. The PWA implementation in `/app/m/` provides all mobile functionality.

---

*Last updated: January 2026*
