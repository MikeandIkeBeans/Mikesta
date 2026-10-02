# Mikesta

Mikesta is a responsive social photo-sharing web application built with semantic HTML, CSS, React, and TypeScript. It functions as a complete, resilient social product surface designed for interview code reviews, local evaluation, and Supabase integration.

## Photography tools

Create a post → choose a sample or upload a photo → adjust exposure, contrast,
warmth, and saturation → share. From any post's Share dialog, choose
**Download postcard** to export a 1200 × 1500 PNG with the actual caption,
location, and creator attribution.

### Engineering decisions to discuss

- **Preview-to-publication consistency:** a shared filter recipe drives CSS preview
  and Canvas rendering. Edited samples and uploads become JPEG files before they
  enter the existing storage pipeline, so filters survive reload and sharing.
- **Bounded image work:** developed photos fit within 1440 × 1440 without
  upscaling or changing aspect ratio. Blob encoding avoids large base64 strings
  during editing; preview and download object URLs are released after use.
- **Explicit failure states:** inaccessible image hosts, export restrictions,
  unsupported Canvas filters, and encoding failures report an error. Failed
  edits keep the composer open rather than silently publishing the original.
- **Honest scope:** warmth is an aesthetic CSS approximation, not RAW white
  balance. Edits are baked at publication; a future non-destructive editor would
  retain the original plus its edit recipe. The postcard preserves the full photo
  and bounds long captions to the print area.
- **Regression coverage:** tests cover sample-photo edit publication, image
  dimensions, real postcard metadata, long captions, and failures with retry.

The React migration replaces the old static pages and service worker. If a browser
previously installed the static app, clear that site's old service-worker/cache
registration before evaluating this version.

## Authentication and persistence

Every route requires a validated Supabase session. Visitors see sign-in and signup
forms while existing sessions are checked before any account data is rendered.
Email confirmation does not grant access until Supabase issues a real session.
Sign out clears the in-memory account state; stale synchronization requests cannot restore it.

In Supabase Authentication → URL Configuration, allow the app's return URLs
(`http://127.0.0.1:5173/`, `http://localhost:5173/`, and the deployed app URL).
Also allow `/reset-password` on each app origin for password recovery.
Signup and confirmation resends explicitly return to the current app origin.
Expired or reused confirmation links display an error with a resend option.
The sign-in screen includes Forgot password; recovery links open a new-password
form after session validation. Reset email delivery uses Supabase's email quota.
Install `supabase-schema.sql` as well as any seed data: the schema includes the
signup profile trigger and backfills profiles for existing accounts.

Posts, profiles, likes, saves, comments, follows, and follower counts load from
Supabase. Mutations update the UI only after a successful remote response. Upload
or database failures remain visible and never create local-only posts or profiles.
Empty remote feeds stay empty. The app ignores old demo identities and feed caches;
only the theme preference and Supabase's own session storage remain local.

Stories are hidden until a persisted implementation is available. Frontend seed
fixtures live under `src/test/fixtures.ts` and are used only by automated tests.
To populate an actual database, use the included SQL seed script deliberately.

---

## Running Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the Vite development server**:
   ```bash
   npm run dev
   ```

3. **Build production bundle**:
   ```bash
   npm run build
   ```

4. **Type check**:
   ```bash
   npm run typecheck
   ```

---

## Database & Supabase Setup

The repository includes both schema migrations and comprehensive seed data:

- **`supabase-schema.sql`**: Creates tables (`profiles`, `posts`, `likes`, `saved_posts`, `comments`, `follows`), row-level security (RLS) policies, and storage setup.
- **`supabase-seed.sql`**: Comprehensive SQL migration script that:
  - Ensures the `posts` storage bucket exists and is public.
  - Seeds confirmed demo users in `auth.users` with password `password123` (`elena@mikesta.com`, `marcus@mikesta.com`, `maya@mikesta.com`, `julian@mikesta.com`).
  - Populates `public.profiles`, `public.posts`, `public.comments`, `public.likes`, and `public.follows` with aesthetic photography and realistic engagement.
  - To apply in Supabase: Open the [Supabase SQL Editor](https://supabase.com/dashboard) and run `supabase-seed.sql`.

---

## Project Structure

```
Mikesta/
├── index.html                   # Entry HTML document
├── package.json                 # Dependencies and scripts (ES module)
├── styles.css                   # Responsive visual system and modal styling
├── supabase-schema.sql          # Base database schema & RLS policies
├── supabase-seed.sql            # Seed SQL migration for Supabase SQL Editor
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite configuration
└── src/
    ├── App.tsx                  # Main application orchestrator & dialog routing
    ├── main.tsx                 # React DOM mount point
    ├── components/
    │   ├── AuthDialog.tsx       # Sign in / Sign up
    │   ├── EditProfileDialog.tsx# Profile details & avatar editor
    │   ├── FeedPage.tsx         # Stories rail, filter tabs, feed list & sidebar
    │   ├── Header.tsx           # Navbar, search, notifications badge, user menu
    │   ├── NotificationsDialog.tsx # Activity feed & mark-as-read
    │   ├── PostCard.tsx         # Post card with double-tap like, comments, actions
    │   ├── PostOptionsDialog.tsx# Context menu for posts (copy, delete, unfollow)
    │   ├── ProfilePage.tsx      # Profile hero, stats, posts/saved tabs
    │   ├── ShareDialog.tsx      # Social & clipboard share options
    │   ├── ShareStoryDialog.tsx # Quick ephemeral story creation
    │   ├── StoryViewer.tsx      # Full-screen story modal with progress timer
    │   └── UploadDialog.tsx     # Post creation with drag-and-drop & photo presets
    └── lib/
        ├── socialTypes.ts       # Social UI domain types
        ├── store.ts             # Authenticated Supabase state store
        └── supabase.ts          # Typed Supabase client and domain definitions
```

## Profile persistence checks

`npm test` covers replacing an uploaded avatar with a preset or URL, visible save
errors with retry, and preserving the local profile when the remote save fails.

For the username allocator, configure a local `DATABASE_URL` in `.env.local`,
place the Supabase root certificate at `supabase-ca.crt`, and run `npm run test:db`.
The test loads the allocator from the migration into the session's temporary
schema and checks duplicate names, occupied fallback names, repeat backfills,
and empty names. All fixtures run inside a rolled-back transaction; it does not
apply the migration or modify existing public/auth tables. PostgreSQL's `psql`
client is required; for Homebrew libpq, run with
`PSQL_BIN="$(brew --prefix libpq)/bin/psql" npm run test:db`.
