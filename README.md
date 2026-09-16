# Mikesta

Mikesta is a warm, tactile social photo-sharing app prototype built with semantic HTML, modern CSS, and vanilla JavaScript. It is intentionally small enough to inspect in an interview, but designed with the polish, micro-interactions, and delight of a modern consumer product.

## Product Features & Vibes

- **Vibe & Mood Switcher**: Instant aesthetic theme switching between *Warm Paper* (editorial cream), *Midnight Film* (dark slate), *Golden Hour* (warm amber), and *Nordic Sage* (cool forest), persisted in local storage.
- **Immersive Stories Viewer**: Instagram/Snapchat-style story viewer featuring segment progress bars, auto-advance timers, tap-to-navigate zones, pause-on-hold, keyboard controls (`←` / `→` / `Space` / `Esc`), floating emoji reaction bursts, and quick replies.
- **Double-Tap / Double-Click Heart Burst**: Double-clicking any post image triggers a spring-animated heart pop explosion and likes the post.
- **Creative Atmosphere Filters**: 7 real-time CSS filter presets (*Normal*, *Vintage*, *Golden*, *Noir*, *Cyber*, *Pastel*, *Vivid*) selectable during post creation and preserved across feeds and profiles.
- **Tactile Web Audio Synthesizer**: Zero-dependency Web Audio API sound effects for likes, reactions, and camera shutter sounds, toggleable from the navbar.
- **Live Search & Autocomplete**: Search bar with real-time dropdown suggestions for creators, locations, and hashtags.
- **Inline Commenting**: Instant comment posting directly from feed cards with live previews.
- **Explore Tag Filter Rail**: Interactive hashtag filter pills (`All`, `Featured`, `Coast`, `Coffee`, `Architecture`, `Nature`) that filter posts smoothly.
- **Profile Archive & Lightbox**: Creator hero header with editable bio and avatar, dynamic "Moments" vs "Saved" tab collections, and photo lightbox modal inspector.
- **Mobile Bottom Navigation**: Native app-style fixed bottom navigation bar for mobile devices.
- **Local State Persistence**: Likes, saves, comments, follow statuses, themes, and created posts persist in `localStorage`.

## Run locally

Open `index.html` or `profile.html` in any modern web browser. No build step, bundler, or dependencies required.

```bash
open index.html
```

## Architecture

The client-side state layer in `script.js` is shaped around a future API boundary:

| Client action | Future API shape |
| --- | --- |
| Load feed | `GET /api/feed?feed=following&tag=coast` |
| Create post with filter | `POST /api/posts` with image metadata, filter, and caption |
| Like or save post | `PUT /api/posts/:postId/reaction` |
| Add comment | `POST /api/posts/:postId/comments` |
| Follow creator | `PUT /api/users/:userId/follow` |
| Load notifications | `GET /api/notifications` |
| Update profile | `PATCH /api/me` |

## Project Files

- `index.html` - Feed, stories rail, hashtag filters, sidebar, create modal, and mobile nav
- `profile.html` - Creator profile, stats, post grid, saved collection, and lightbox
- `styles.css` - Design tokens, themes, responsive layout, animations, and components
- `script.js` - State engine, theme controller, story viewer, audio synth, and interactions
