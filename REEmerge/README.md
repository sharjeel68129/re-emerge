# Registrar — a four-year task log

Next.js (TypeScript) + Supabase app for tracking tasks across six time
horizons — daily, weekly, monthly, semester, yearly, and "before I
graduate" — and generating a PDF record of everything you did or
attempted across university, once you're done.

## 1. Create the Supabase project

1. Go to https://supabase.com, create a new project (free tier is fine).
2. Open **SQL Editor** → paste the contents of `supabase/schema.sql` → run it.
   This creates the `profiles` and `tasks` tables with row-level security,
   so each signed-in user only ever sees their own data.
3. Go to **Authentication → Providers** and make sure **Email** is enabled.
   The app uses email + password sign-up now. If you'd rather skip email
confirmation for a personal single-user project, go to
**Authentication → Settings** and turn off "Confirm email" — then
sign-up logs you straight in instead of asking you to check your inbox.
4. Go to **Authentication → URL Configuration** and add your site URL
   (e.g. `http://localhost:3000` while developing, and your Vercel URL
   once deployed) to **Redirect URLs**.
5. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Run it locally

```bash
cp .env.local.example .env.local
# paste your two Supabase values into .env.local
npm install
npm run dev
```

Visit `http://localhost:3000`, click "Create an account," agree to the
Terms and Privacy Policy (edit `app/terms/page.tsx` and
`app/privacy/page.tsx` with your own details first), set your program
start/graduation dates when prompted, and start adding tasks.

## 3. Deploy to Vercel

```bash
npm install -g vercel   # if you don't have it
vercel
```

Or from vercel.com: **New Project → Import** this folder/repo, then in
**Settings → Environment Variables** add the same two variables from
`.env.local`. Redeploy after adding them.

Once deployed, go back to Supabase **Authentication → URL Configuration**
and add your `https://your-app.vercel.app` URL (and
`https://your-app.vercel.app/auth/callback`) to the allowed redirect URLs,
or sign-up/confirmation links will bounce you back to `localhost`.

## How it's organized

- `supabase/schema.sql` — the whole database schema + security policies.
  Run once, in Supabase's SQL editor.
- `app/login`, `app/signup`, `app/forgot-password`, `app/reset-password`,
  `app/auth/callback` — email + password auth, plus a password
  reset/set flow that also works for an account that only ever used
  the old magic-link sign-in.
- `app/settings` — change password, change email (with dual
  confirmation), delete account, sign out, and links to the legal pages.
- `components/Dashboard.tsx` — the whole app UI: tabs, add form, list,
  celebration, graduation button. It's intentionally one file since it's
  a small personal tool — split it up if it grows on you.
- `app/api/graduation-pdf/route.ts` — builds the PDF server-side from
  your actual task history, grouped by year-of-program and category.
- Row-level security means the Supabase anon key is safe to expose to
  the browser — Postgres itself enforces that you can only read/write
  your own rows.

## Notes on the "4 years" framing

The PDF groups tasks into "Year 1 / Year 2 / …" based on how far each
task's creation date falls from the **start date** you set in your
profile — not the calendar year. If you never set a start date, it
falls back to grouping by calendar year instead. You can edit your
program dates any time from the "edit program dates" link on the
dashboard.

## Settings, account changes, and getting a password on an old account

The Settings page (linked from the top bar) covers changing your
password, changing your email, deleting your account, and signing out.
Two things need a one-time setup step in Supabase:

1. **Deleting an account** calls `app/api/delete-account`, which needs
   `SUPABASE_SERVICE_ROLE_KEY` set (see `.env.local.example`) — both
   locally and in Vercel's environment variables once deployed. Never
   give this key a `NEXT_PUBLIC_` prefix; it bypasses row-level
   security entirely and must stay server-side only.
2. **Changing email with dual confirmation** — go to Supabase →
   Authentication → Settings and turn on **"Secure email change"**.
   With it on, a confirmation link goes to both your old and new
   address, and the change only applies once both are clicked. Without
   it, only the new address gets a confirmation link.

**If your account predates this update** (it was signed in with a
magic link, so it has no password): go to the login page → "Forgot
your password? (or setting one for the first time)" → enter your
email. You'll get a link that lets you set a password — from then on,
log in with email + password like normal.
