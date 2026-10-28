# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Strata
**Generated:** 2026-10-29 04:05:29
**Updated:** 2026-10-29 (project anti-pattern overrides)
**Source:** UI/UX Pro Max `--design-system` (Productivity Tool) + Project preferences
**Category:** Productivity Tool
**Style:** Soft UI Evolution (preferred over Flat for app shell depth)
**Design Dials:** Variance 4/10 (Balanced / Modern) | Motion 3/10 (Subtle) | Density 8/10 (Dense / Dashboard)

---

## Project Overrides (authoritative)

These beat the raw search palette where they conflict:

1. **No purple-on-white** — reject indigo Micro-SaaS (`#6366F1` / `#F5F3FF`).
2. **No cream + terracotta** — reject warm paper and orange/terracotta CTAs (`#EA580C` not used as primary CTA).
3. **No dark mode by default**, no glow, no emoji icons, no competitor product names in copy.
4. **CTA** uses deep teal (same family as primary), not orange.
5. **Typography pairing:** Plus Jakarta Sans (body/UI) + Newsreader (brand / page titles) via `next/font` — distinctive without Inter/system stacks.
6. **Atmosphere:** cool slate + teal radial wash + light paper grain — Soft UI Evolution, not flat single fill.

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#0D9488` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Secondary | `#14B8A6` | `--color-secondary` |
| On Secondary | `#0F172A` | `--color-on-secondary` |
| Accent/CTA | `#0F766E` | `--color-accent` |
| On Accent/CTA | `#FFFFFF` | `--color-on-accent` |
| Background | `#F4F7F8` | `--color-background` |
| Foreground | `#0F172A` | `--color-foreground` |
| Card | `#FFFFFF` | `--color-card` |
| Card Foreground | `#0F172A` | `--color-card-foreground` |
| Muted | `#E8EEF1` | `--color-muted` |
| Muted Foreground | `#475569` | `--color-muted-foreground` |
| Border | `#D5DEE3` | `--color-border` |
| Destructive | `#DC2626` | `--color-destructive` |
| On Destructive | `#FFFFFF` | `--color-on-destructive` |
| Ring | `#0D9488` | `--color-ring` |
| Warn | `#B45309` | `--color-warn` |

**Color Notes:** Productivity teal + cool slate neutrals. Soft mint wash in atmosphere only. CTA is deep teal (project override of orange).

### Typography

- **Display / Brand:** Newsreader
- **Heading / Body / UI:** Plus Jakarta Sans
- **Mood:** friendly, modern, saas, clean, approachable, professional
- **Load:** `next/font/google` in root `layout.tsx` only (Next.js stack guideline)

### Spacing Variables

*Density: 8/10 — Dense / Dashboard*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `2px` | Tight gaps |
| `--space-sm` | `4px` | Icon gaps |
| `--space-md` | `8px` | Standard padding |
| `--space-lg` | `12px` | Section padding |
| `--space-xl` | `16px` | Large gaps |
| `--space-2xl` | `24px` | Section margins |
| `--space-3xl` | `32px` | Page chrome |

### Shadow Depths (Soft UI Evolution)

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(15,23,42,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 12px rgba(15,23,42,0.07)` | Interactive surfaces |
| `--shadow-lg` | `0 12px 28px rgba(15,23,42,0.10)` | Auth card / search |

---

## Component Specs

### Buttons

- Radius: `8px` (not pills)
- Primary: deep teal CTA, white text, 150–200ms hover
- Ghost: transparent + border, slate text
- Min interactive height ~40px where practical

### Cards / Rows

- Cards only when they aid interaction (forms, task detail panels, board cards)
- List/project rows prefer flat dividers over heavy card chrome
- Soft border + optional soft shadow; no multi-layer glow

### Navigation

- Elevated sidebar with strong **Strata** brand mark
- Sticky top chrome with brand echo
- Active nav: teal mist fill + left indicator (subtle motion)

### Motion (Subtle / dial 3)

1. Sidebar active indicator expand (~200ms)
2. Task pane enter fade+8–12px (`pane-enter`)
3. Task/board hover lift 1px + border teal
- Always respect `prefers-reduced-motion`

---

## Style Guidelines

**Style:** Soft UI Evolution

**Keywords:** Evolved soft UI, better contrast, modern aesthetics, subtle depth, accessibility-focused, improved shadows, hybrid

**Key Effects:** Soft shadows, modern 150–300ms transitions, visible focus rings, measured contrast

### App Pattern (not marketing landing)

App shell: sidebar + top chrome + dense list/board/task surfaces. Preserve existing routes and Better Auth / server actions.

---

## Anti-Patterns (Do NOT Use)

- ❌ Purple-on-white / indigo SaaS defaults
- ❌ Cream paper + terracotta accents
- ❌ Dark mode by default / purple glow / emoji icons
- ❌ Rounded-full pill buttons as the primary language
- ❌ Cluttered first viewport / competing card grids
- ❌ Competitor product names in UI copy
- ❌ Instant state changes (0ms) / invisible focus

---

## Pre-Delivery Checklist

- [ ] No emojis as icons
- [ ] `cursor: pointer` on clickable controls
- [ ] Hover transitions 150–300ms
- [ ] Text contrast ≥ 4.5:1
- [ ] Visible focus rings
- [ ] `prefers-reduced-motion` respected
- [ ] Usable at 375 / 768 / 1024 / 1440
- [ ] Auth and server actions unchanged
