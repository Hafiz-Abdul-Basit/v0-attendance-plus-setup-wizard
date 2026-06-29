# AttendancePlus Setup Wizard

> **Automatically synced with your [v0.dev](https://v0.dev) deployments**
>
> Code & Configuration Hub for the AttendancePlus system — installation
> guides, snippet library, client setup automation, and configuration
> editors for truancy / component / setup configs.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/hafizabdulbasits-projects/v0-attendance-plus-setup-wizard)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/cvaGVSWzKue)

---

## What's new in this version

This app now has a real backend:

- **Email + password authentication** (NextAuth.js, bcrypt, JWT sessions in httpOnly cookies)
- **Cloud database** for snippets (Supabase / PostgreSQL)
- **Server APIs** for snippet CRUD
- **Middleware-gated routes** — unauthenticated visitors are redirected to `/login`
- Snippets are fetched on demand instead of being bundled into the JS payload

The UI is unchanged from the prior version.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| UI | React 18 + TypeScript + Tailwind + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | NextAuth.js (Credentials provider, JWT strategy) |
| Password hashing | bcryptjs (12 rounds) |
| Validation | zod |
| Client data fetching | SWR |

---

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create the Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a new project
2. Open **SQL Editor** in the Supabase dashboard
3. Paste the contents of [`supabase/schema.sql`](./supabase/schema.sql) and run it
4. From **Settings → API**, copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (secret — never expose to the browser)

### 3. Configure environment

```bash
cp .env.local.example .env.local
# edit .env.local with the values from step 2
```

Generate a NextAuth secret:

```bash
openssl rand -base64 32
# paste into NEXTAUTH_SECRET
```

### 4. Seed the snippets

```bash
npm run db:seed        # upserts the 22 hardcoded snippets
npm run db:reset       # truncates and re-seeds (destructive)
```

This is a one-time operation. After it completes, `data/snippets.tsx` becomes
the only place the seed data lives, and the running app reads from Supabase.

### 5. Run the app

```bash
npm run dev
# open http://localhost:3000
# you'll be redirected to /login → click "Create one" to register
```

---

## Deployment to Vercel

This app is already deployed via GitHub at
**https://attendance-plus-setup-guide.vercel.app/**. Use the steps below
to re-deploy after a change, or to set up a fresh Vercel project.

### 1. Add the Vercel environment variables

In the Vercel dashboard → **Project → Settings → Environment Variables**,
add the following. Apply each one to **Production**, **Preview**, and
**Development** (or scope per-environment — see notes).

| Variable | Required? | Where to get it |
|---|---|---|
| `NEXTAUTH_SECRET` | yes | Run `openssl rand -base64 32` once and paste the output. Keep this secret — it signs your JWT cookies. |
| `NEXTAUTH_URL` | production only | `https://attendance-plus-setup-guide.vercel.app`. Leave unset on Preview branches so NextAuth falls back to the request origin. |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase dashboard → **Settings → API → Project URL** (e.g. `https://abcdefgh.supabase.co`). |
| `SUPABASE_SERVICE_ROLE_KEY` | yes (server-only) | Supabase dashboard → **Settings → API → service_role**. **Never** prefix this with `NEXT_PUBLIC_` — it bypasses RLS. |
| `SUPABASE_PROJECT_REF` | only for `db:apply-schema` | The slug between `https://` and `.supabase.co` (e.g. `abcdefgh`). |
| `SUPABASE_DB_PASSWORD` | only for `db:apply-schema` | The password you set when creating the Supabase project. |

After saving, hit **Deployments → ⋯ → Redeploy** so the new env vars
take effect (Vercel does not re-inject them into already-built
deployments).

### 2. Run the schema migration against production

The `supabase/schema.sql` file is **idempotent** — running it twice is
safe. It creates the `users` and `snippets` tables, sets up RLS,
configures the `role` column, and (now) adds the
`password_reset_token` / `password_reset_expires` columns for the
forgot-password flow.

Pick one of two approaches:

**A. From your terminal (recommended — uses the script already wired
into `package.json`):**

```bash
SUPABASE_PROJECT_REF=abcdefgh \
SUPABASE_DB_PASSWORD='your-db-password' \
  npm run db:apply-schema
```

The script (`supabase db push --db-url "postgres://postgres:${SUPABASE_DB_PASSWORD}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres" --include-all`)
talks to the production database directly using the Supabase CLI that's
already in `devDependencies`.

**B. From the Supabase SQL Editor:**

1. Open https://supabase.com/dashboard → your project → **SQL Editor**
2. Paste the contents of `supabase/schema.sql`
3. Click **Run** (or press `Ctrl+Enter`)

### 3. Trigger a deploy

- **Auto:** push to the `main` branch on GitHub — Vercel picks it up
  and deploys automatically.
- **Manual:** Vercel → **Deployments → ⋯ → Redeploy**.

The build command is `npm run build` (set automatically by Vercel via
the Next.js framework preset). Output goes to `.next`.

### 4. Verify the live deployment

Visit **https://attendance-plus-setup-guide.vercel.app/** and confirm:

- [ ] Redirect to `/login` works.
- [ ] Signing in with `a.basit.freelancer@gmail.com` redirects to
      `/admin` (this user is hard-coded as admin in `schema.sql`).
- [ ] The Component Configuration editor shows the **Smart Search &
      Replace** bar and the new **full-height JSON preview** with a
      working search.
- [ ] `/login → "Forgot password?"` → submit a registered email → in
      dev the link is shown on the success screen; click it to set a
      new password.
- [ ] `/admin` Users + Snippets tabs both render and the role select
      / delete buttons work.

### Troubleshooting

| Symptom | Likely cause |
|---|---|
| `NEXTAUTH_SECRET` mismatch errors | The secret differs between local and Vercel. Pick one and stick with it — rotating it invalidates all sessions. |
| API routes 401 with a valid session | `NEXTAUTH_URL` is set wrong. For `https://attendance-plus-setup-guide.vercel.app` it must be exactly that. |
| `permission denied for table users` | The `service_role` key isn't bypassing RLS — check that `SUPABASE_SERVICE_ROLE_KEY` (not the anon key) is set. |
| Schema migration runs but columns missing | Old database — re-run `supabase/schema.sql`; every `add column` uses `if not exists`. |
| Forgot-password link never arrives | In production the email provider isn't wired up yet — see `lib/passwordResetEmail.ts`. In dev the link is printed on the success page instead. |

---

## API reference

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/snippets` | optional | List public snippets. Query params: `q` (full-text), `category`, `tag` |
| `GET` | `/api/snippets/[id]` | optional | Fetch one snippet by legacy id (`"frontend-webconfig"`) |
| `POST` | `/api/snippets` | required | Create a snippet |
| `PUT` | `/api/snippets/[id]` | required | Update a snippet |
| `DELETE` | `/api/snippets/[id]` | required | Delete a snippet |
| `POST` | `/api/auth/register` | none | `{ email, password, name? }` → creates user |
| `*` | `/api/auth/*` | n/a | NextAuth handlers |

`required` = rejected with 401 if no valid NextAuth JWT cookie.

---

## Project structure

```
app/
├── api/
│   ├── auth/
│   │   ├── [...nextauth]/route.ts   # NextAuth handlers
│   │   └── register/route.ts        # POST /api/auth/register
│   └── snippets/
│       ├── route.ts                 # GET (list) + POST (create)
│       └── [id]/route.ts            # GET / PUT / DELETE
├── login/page.tsx                   # Sign-in page
├── register/page.tsx                # Sign-up page
├── layout.tsx                       # Root layout + <AuthProvider>
├── page.tsx                         # <InstallationWizard />
├── ClientLayout.tsx                 # Client shell: <ESignSetupGuide> + <AuthHeader>
└── globals.css

components/
├── installation-wizard.tsx          # Main shell (unchanged UI)
├── snippets-content.tsx             # Snippet library (data source now from API)
├── step-content.tsx                 # Per-section steps (unchanged)
├── interactive-guides.tsx           # Drag-drop playground (unchanged)
├── esign-setup-guide.tsx            # F7 modal (unchanged)
├── ClientSetupAgent.tsx             # Deployment CRUD (unchanged)
├── auth/
│   ├── AuthProvider.tsx             # <SessionProvider> wrapper
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   └── AuthHeader.tsx               # Floating user/logout chip
├── client-setup/                    # Truancy / Component / Setup editors (unchanged)
└── ui/                              # shadcn primitives (unchanged)

lib/
├── auth.ts                          # NextAuth config (Credentials + bcrypt)
└── supabase.ts                      # Server-side Supabase client

hooks/
├── use-snippets.ts                  # SWR hook: /api/snippets
└── use-toast.ts

supabase/
└── schema.sql                       # Run once in Supabase SQL editor

scripts/
└── seed-snippets.ts                 # `npm run db:seed`

data/
└── snippets.tsx                     # @deprecated — kept as seed input only

middleware.ts                        # Auth-gates all routes except /login, /register, /api/auth/*
types/
└── next-auth.d.ts                   # Session.user.id type augmentation

utils/                               # (unchanged) clipboard, scriptTemplates, setupUtils, clientSetupStorage
```

---

## Deployment

Your project is live at:

**[https://vercel.com/hafizabdulbasits-projects/v0-attendance-plus-setup-wizard](https://vercel.com/hafizabdulbasits-projects/v0-attendance-plus-setup-wizard)**

## Build your app

Continue building on:

**[https://v0.dev/chat/projects/cvaGVSWzKue](https://v0.dev/chat/projects/cvaGVSWzKue)**

## How It Works

1. Edit locally or on [v0.dev](https://v0.dev)
2. Push to this repo
3. Vercel auto-deploys
