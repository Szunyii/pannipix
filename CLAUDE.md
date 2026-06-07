# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint
```

There are no tests in this project.

## What this is

A single-page marketing/landing page generated with [v0.app](https://v0.app). Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS v4. Deployed/instrumented via Vercel Analytics.

## Key architectural notes

- **The entire experience lives in [app/page.tsx](app/page.tsx)** — a single client component (`"use client"`). It is *horizontally* scrolled: each `<section>` is `w-screen shrink-0` inside a horizontally-overflowing flex container. Vertical wheel/touch input is intercepted and translated into horizontal scroll (see the three `useEffect` handlers for `wheel`, `touch*`, and `scroll`). Section index is tracked in `currentSection` state; nav links and swipes call `scrollToSection(index)`. The five sections (Hero, Work, Services, About, Contact) are hardcoded — `currentSection` is clamped to `0..4`, so adding/removing a section means updating those bounds and the nav array.

- **WebGL shader background** comes from the `shaders` npm package (`shaders/react`): `<Shader>` wrapping `<Swirl>` + `<ChromaFlow>` in `app/page.tsx`. The page fades in (`isLoaded`) only after polling detects the shader `<canvas>` has nonzero dimensions, with a 1.5s fallback timer.

- **Section components** live in [components/sections/](components/sections/) and use the [useReveal](hooks/use-reveal.ts) hook (IntersectionObserver) to trigger entrance animations via conditional Tailwind classes. Content (work items, services, etc.) is hardcoded inline as arrays within each section.

- **Custom interactive components** (not shadcn): [MagneticButton](components/magnetic-button.tsx) (cursor-following transform via rAF), [CustomCursor](components/custom-cursor.tsx), [GrainOverlay](components/grain-overlay.tsx). `MagneticButton` is the standard CTA — prefer it over `components/ui/button.tsx` for page CTAs, matching existing usage.

- **shadcn/ui** components in [components/ui/](components/ui/) — "new-york" style, configured in [components.json](components.json). Most are unused scaffolding from the v0 template; only pull in what a change actually needs.

## Conventions

- **Path alias:** `@/*` maps to the repo root (e.g. `@/components/...`, `@/hooks/...`, `@/lib/utils`).
- **Styling:** Tailwind v4 (no `tailwind.config` file; config is CSS-based). Theme tokens are CSS variables in [app/globals.css](app/globals.css) using `oklch` — the design is **dark by default** (`--background` is near-black). Use semantic tokens (`text-foreground`, `bg-background`, `text-foreground/60`) rather than raw colors. Glassmorphism (`backdrop-blur-*` + `bg-foreground/10` borders) is the recurring visual motif.
- Use the `cn()` helper from [lib/utils.ts](lib/utils.ts) for conditional class merging.
- `styles/globals.css` is a leftover duplicate; the active stylesheet is `app/globals.css` (imported in [app/layout.tsx](app/layout.tsx)).

## Build gotchas

[next.config.mjs](next.config.mjs) sets `eslint.ignoreDuringBuilds`, `typescript.ignoreBuildErrors`, and `images.unoptimized` to **true**. Type and lint errors will NOT fail the build — run `npm run lint` and check types explicitly; do not rely on `npm run build` to catch them.
