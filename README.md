# Mikesta

Mikesta is a responsive social photo-sharing prototype built with semantic HTML, CSS, and vanilla JavaScript. It is intentionally small enough to inspect in an interview, but it behaves like a real product surface rather than a static mockup.

## Product flows

- Feed with posts, likes, saves, comments, sharing, post actions, and persisted state
- Stories rail with story viewer and create-your-story entry point
- Create-post flow with image validation, drag-and-drop preview, caption, location, and optimistic feed insertion
- Search feedback for creators, locations, and feed content
- Feed filters: Following, For you, and Recent
- Follow/unfollow suggestions with local persistence
- Notifications dialog with activity states
- Profile page with post/saved tabs and editable profile details
- Toast feedback, focus management, Escape-to-close, and responsive mobile layouts

## Run locally

Open `index.html` in a browser. There is no build step. Local state is stored under `localStorage` when the browser permits it; the app remains usable for the current session when opened from a restricted `file://` context.

## Architecture

The current client-side state layer in `script.js` is deliberately shaped around a future API boundary:

| Client action | Future API shape |
| --- | --- |
| Load feed | `GET /api/feed?feed=following` |
| Create post | `POST /api/posts` with image metadata and caption |
| Like or save post | `PUT /api/posts/:postId/reaction` |
| Add comment | `POST /api/posts/:postId/comments` |
| Follow creator | `PUT /api/users/:userId/follow` |
| Load notifications | `GET /api/notifications` |
| Update profile | `PATCH /api/me` |

The browser prototype keeps those operations local so the product can be reviewed without credentials or a server. A production version would move the state functions behind `fetch` calls, add authentication, validate uploads server-side, persist media in object storage, and return cursor-based feed pagination.

## Project files

- `index.html` - feed, stories, sidebar, and create-post modal
- `profile.html` - profile header, tabs, and post grid
- `styles.css` - shared responsive visual system and interaction surfaces
- `script.js` - state, UI primitives, event delegation, persistence, and client workflows
