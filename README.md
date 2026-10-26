# Strata

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mzaid007/strata)

**Strata** is a hobby open-source project: a work management app in the spirit of Asana — projects, multi-home tasks, boards, inbox, goals, and optional free-tier AI assists. Built for learning and self-hosting, not as an internal company product.

**Demo:** [https://strata-six-neon.vercel.app](https://strata-six-neon.vercel.app) — try the UI on a hosted instance. Sign up there, or run locally and register / seed your own workspace.

## Stack

| Layer | Choice |
|---|---|
| App | [Next.js 15](https://nextjs.org/) (App Router) + React 19 |
| Language | TypeScript |
| Auth | [Better Auth](https://www.better-auth.com/) (email / password) |
| Database | Postgres via [Prisma](https://www.prisma.io/) — [Neon](https://neon.tech/) recommended |
| Hosting | [Vercel](https://vercel.com/) |

## Features

- **Workspaces & projects** — onboarding, members, project list/board views
- **Multi-home tasks** — a task can live in multiple projects (membership + section + order)
- **My Tasks & Inbox** — assignment-based personal work and notifications
- **Calendar & timeline** — project scheduling views
- **Goals, portfolios, workload** — higher-level planning surfaces
- **Forms & rules** — lightweight intake and automation hooks
- **Admin** — basic workspace settings
- **Optional AI** — task summarize / draft / suggest via free providers (see below)
- **Public forms** — shareable form links under `/f/[slug]`

## Prerequisites

- Node.js **20+** (22 recommended)
- A real Postgres URL (free [Neon](https://console.neon.tech) project works well)

## Setup

```bash
git clone https://github.com/mzaid007/strata.git
cd strata
cp .env.example .env   # Windows: copy .env.example .env
```

Edit `.env` (see [Environment variables](#environment-variables)):

1. Set `DATABASE_URL` to your Neon (or other Postgres) connection string — must look like `postgresql://…@ep-….neon.tech/…?sslmode=require`, not a placeholder host.
2. Set `BETTER_AUTH_SECRET` to a random string **≥ 32 characters**, e.g. `openssl rand -base64 32`.
3. Keep `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` as `http://localhost:3000` for local development.

```bash
npm install
npx prisma db push
npm run db:seed    # optional: sample workspace for local exploration
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and **register** a new account, or use whatever accounts the seed script prints to your terminal (local only). Prefer **localhost** over a LAN IP for sign-in.

On Windows you can also run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-local.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\print-env-checklist.ps1
```

## Environment variables

Do **not** commit `.env`. Copy from `.env.example`.

| Name | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres URI (Neon / Supabase / local). Placeholder hosts cause Prisma **P1001**. |
| `BETTER_AUTH_SECRET` | Yes | Auth signing secret, **≥ 32 chars** |
| `BETTER_AUTH_URL` | Local / custom domain | App origin, e.g. `http://localhost:3000`. On Vercel you can omit and rely on `VERCEL_URL`. |
| `NEXT_PUBLIC_APP_URL` | Same as above | Public origin for the auth client |
| `BETTER_AUTH_TRUSTED_ORIGINS` | No | Comma-separated extra trusted origins (dev LAN, etc.) |
| `GROQ_API_KEY` | No | [Groq](https://console.groq.com/) API key (tried first) |
| `GROQ_MODEL` | No | Override Groq model (default free-tier ID in code) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | No | [Google AI](https://aistudio.google.com/) key (fallback) |
| `GOOGLE_AI_MODEL` | No | Override Google model |
| `OPENROUTER_API_KEY` | No | [OpenRouter](https://openrouter.ai/) key (last fallback) |
| `OPENROUTER_MODEL` | No | Defaults to `openrouter/free` |

### Free AI providers

AI features are optional. When configured, Strata tries providers in order and falls back on failure:

1. **Groq** (`GROQ_API_KEY`)
2. **Google Generative AI** (`GOOGLE_GENERATIVE_AI_API_KEY`)
3. **OpenRouter** (`OPENROUTER_API_KEY`) with model `openrouter/free` by default

Set any combination; only configured keys are used.

## Deploy (Vercel + Neon)

1. Push or fork [mzaid007/strata](https://github.com/mzaid007/strata).
2. Import the repo on [Vercel](https://vercel.com/new) → Framework Preset **Next.js**.
3. Add env vars: `DATABASE_URL` (Neon), `BETTER_AUTH_SECRET` (≥ 32 chars). For a custom domain set `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` to that `https://…` origin; otherwise Vercel’s `VERCEL_URL` is enough for the default `*.vercel.app` URL.
4. Optional: add one or more of `GROQ_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `OPENROUTER_API_KEY` (and model overrides if needed).
5. Build command is already `prisma generate && next build` via `npm run build`.
6. Once against production Postgres, run `npx prisma db push` (and optionally `npm run db:seed`) from a trusted machine — do not put seed passwords in production UI or docs.

## Core model

A **Task** can appear in many **Projects** via `TaskMembership` (project + section + order). **My Tasks** is assignment-based, not a separate task type.

## License

[MIT](./LICENSE) © 2026 mzaid007
