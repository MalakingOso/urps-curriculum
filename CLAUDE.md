# URPS Fellowship Curriculum (education.xenoj.com)

Deno Fresh 2 + Vite site. Content: `data/curriculum.json` (canonical; edit directly). Tasks: see README.md.

- Server-rendered routes in `routes/`; interactivity only in `islands/` (Journey, Coverage, Library, SearchBox).
  Island props carry `SessionSummary` objects with a lowercase `text` search blob (`lib/curriculum.ts`).
- Search is a shared signal in `lib/search.ts`, initialized from `?q=` in the browser only. On the server,
  islands read `initialQ` via `currentQuery()` so no request state lives in a module-level variable.
- Styles: `assets/styles.css` (imported via `client.ts`), derived from the approved editorial mockup.
  Fonts are vendored in `static/fonts/`, so there is no font CDN.
- Design is settled: editorial (Newsreader/Geist, urogyn palette) + frosted sticky nav. Copy stays plain and
  document-like. No taglines.
- Facts: the fellowship is 3 years and this is its 2-year didactic curriculum. The textbook is Walters & Karam
  **5th** edition. There are no attending names on the site.
- `.heat-wrap` needs `position: relative`: the `.vh` labels inside grid cells are absolutely positioned and
  would otherwise escape the scroll container and widen the page on phones.
- Deploy: `deploy/README.md`. Port 8001. Its Caddy block must also live in urogyn-analyzer's
  `deploy/Caddyfile`, because that file is what gets copied to `/etc/caddy/Caddyfile`.
