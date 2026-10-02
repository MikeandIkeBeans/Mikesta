# Mikesta

Mikesta is a responsive social photo-sharing web application built with semantic HTML, CSS, React, and TypeScript. It functions as a complete, resilient social product surface designed for interview code reviews, local evaluation, and Supabase integration.

## Key Features & Robustness Enhancements

- **Resilient Data Layer & State Store (`src/lib/store.ts`)**:
  - Automatically loads and hydrates rich seed fixtures so the application is vibrant and interactive out-of-the-box.
  - Hybrid synchronization with Supabase: reads and writes to Supabase when authenticated, while gracefully falling back to a persistent local state store (`localStorage`) during network interruptions, unconfirmed emails, or missing storage buckets.
  - One-click demo user switching in the navbar between multiple creator profiles (Elena Rodriguez, Marcus Chen, Maya Lin, Julian Vance).
- **Feed & Filter System**:
  - Interactive filter tabs: **Following** (posts from creators you follow), **For you** (engagement-ranked feed), and **Recent** (chronological order).
  - Hashtag / Topic exploration pills: One-click chips (`All`, `#minimalism`, `#architecture`, `#coffee`, `#ceramics`, `#scandinavia`, `#light`, `#wanderlust`) that dynamically filter feed results.
  - Interactive captions: Clicking any `#hashtag` within a post caption immediately filters the feed by that tag.
  - Real-time search filtering across post captions, creator usernames, display names, and locations with instant match feedback and clear-search button.
- **Post Detail / Lightbox View (`src/components/PostDetailModal.tsx`)**:
  - Desktop two-column modal showing high-res imagery, author follow status, scrollable comment feed, inline comment composer, and real-time like toggles.
  - Accessible from post feed expand buttons or clicking any photo in the profile grid.
- **Stories Rail & Story Viewer (`src/components/StoryViewer.tsx`)**:
  - Gradient ring avatars with unread/viewed indicators.
  - Full-screen modal story viewer with an animated progress timer bar, keyboard navigation (Left/Right/Escape), click-zone navigation, and captions.
  - "Share a story" flow with curated photography presets.
- **Robust Post Creation Flow (`src/components/UploadDialog.tsx`)**:
  - Drag-and-drop file upload with preview, file validation, caption input, and location tagging.
  - Curated sample photo presets for instant testing without needing local image files.
  - Multi-tier storage fallback: attempts Supabase storage upload, falling back to data URL encoding so post creation never fails due to missing storage buckets or authentication policies.
  - Optimistic feed insertion and profile archive updates.
- **Engagement & Social Interactions**:
  - Double-click / double-tap image heart animation with optimistic like count toggling.
  - Bookmarks & Saved collection synced to user profile.
  - Comments panel with inline submission, author comment deletion, and count tracking.
  - Post options menu (`...` button) for copying links, sharing, unfollowing, and deleting own posts.
  - Share dialog with clipboard copy and native share API integration.
  - Suggested creators sidebar with interactive **Follow / Unfollow** buttons that update profile follower counts and the Following feed in real-time.
- **Notifications Activity Dialog (`src/components/NotificationsDialog.tsx`)**:
  - Navbar heart icon with an unread badge indicator.
  - Activity drawer showing likes, comments, follows, and saves with timestamps and "Mark all as read" capability.
- **Profile Page & Profile Editor (`src/components/EditProfileDialog.tsx`)**:
  - Profile statistics: posts, followers, following.
  - Posts tab vs. Saved collection tab.
  - Dedicated Edit Profile modal supporting custom display names, usernames, bios, and avatar URLs or preset avatars.
- **Accessibility, Power-User & Offline Support**:
  - Interactive **Keyboard Shortcuts** modal (press `?` anywhere to view keybindings: `?`, `n`, `t`, `j/k`, `l`, `c`, `s`, `Esc`).
  - Active **Offline Detection Banner**: informs the user when internet connectivity drops and ensures moments/comments remain safely cached.
  - Modal scroll-locking (`dialog-open`) and `Escape` key close management across all views.
  - Responsive layouts from desktop down to mobile screen sizes.

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
    │   ├── AuthDialog.tsx       # Sign in / Sign up & 1-click demo user switcher
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
        ├── mockData.ts          # Seed profiles, posts, stories, suggestions
        ├── store.ts             # Reactive data store with Supabase sync & offline fallback
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
