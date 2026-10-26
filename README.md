# Strata

Internal work management (clean-room Asana-inspired). **Core phase** scaffold: email/password auth, multi-home tasks, list + board, My Tasks, Inbox, thin Admin.

Develop on `f:\Strata`. Deploy target: **Vercel + Neon Postgres** (Supabase Postgres also fine).

## Prerequisites

- Node.js 20+ (22 recommended)
- A **real** Postgres URL — free [Neon](https://console.neon.tech) project (do not leave `.env.example` placeholders)

## Neon setup (required before `db push`)

1. Create a free project at [https://console.neon.tech](https://console.neon.tech).  
2. Copy the connection string from **Connect** (must look like `postgresql://…@ep-….neon.tech/neondb?sslmode=require` — **not** `@HOST`).  
3. On this machine:

```powershell
cd f:\Strata
copy .env.example .env
```

4. Edit `.env`:
   - `DATABASE_URL` = paste Neon URI  
   - `BETTER_AUTH_SECRET` = output of `openssl rand -base64 32` (or `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`) — **≥ 32 characters**  
   - Keep `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` as `http://localhost:3000` for local  
5. Sanity-check (no secret dump):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\print-env-checklist.ps1
```

More detail: Project store `docs/neon-setup.md`.

## Setup

```powershell
cd f:\Strata
# .env already configured (see Neon setup above)

npm install
npx prisma db push
npm run db:seed
npm run dev
```

Or after `.env` is correct: `powershell -ExecutionPolicy Bypass -File .\scripts\setup-local.ps1`

Open [http://localhost:3000/login](http://localhost:3000/login) (prefer **localhost**, not a LAN IP — see login notes in Project `docs/core-scaffold-status.md` if sign-in hangs).

### Demo users (after seed)

| Email | Password | Role |
|---|---|---|
| `ava@strata.local` | `strata-demo-1` | Owner |
| `ben@strata.local` | `strata-demo-1` | Member |

## Env vars

| Name | Purpose |
|---|---|
| `DATABASE_URL` | Real Neon/Supabase/local Postgres URI (placeholder `HOST` causes Prisma **P1001**) |
| `BETTER_AUTH_SECRET` | Auth signing secret, **≥ 32 chars** |
| `BETTER_AUTH_URL` | App origin, e.g. `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | Same origin for the auth client |

Do **not** commit `.env`.

## Vercel deploy (notes)

1. Push this repo to GitHub/GitLab (when ready).  
2. Import on Vercel → Framework Preset **Next.js**.  
3. Add env vars: `DATABASE_URL` (Neon), `BETTER_AUTH_SECRET` (≥ 32 chars), `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` = your `https://….vercel.app` URL.  
4. Build: `prisma generate && next build` (`npm run build`).  
5. Run `prisma db push` + `db:seed` once against Neon from a trusted machine.

## Core model (multi-home)

A **Task** can appear in many **Projects** via `TaskMembership` (project + section + order). My Tasks is assignment-based, not a separate task type.

## Out of Core (later phases)

Calendar, timeline, goals, portfolios, workload, forms, rules, AI (free APIs only) — see Project store docs. No SSO / Slack / Jira / mobile for now.

## License

Private / internal use.
