# URPS Fellowship Curriculum

Source for [education.xenoj.com](https://education.xenoj.com): a browsable version of the fellowship's
60-session, two-year didactic curriculum, mapped to the AUGS Guide to Learning (2024), the URPS Qualifying
Exam Blueprint, and Walters & Karam, 5th edition.

- **Curriculum** (`/`): the four blocks and their sessions, filterable by type and GTL section.
- **Session pages** (`/sessions/1` … `/sessions/60`): learning objectives, textbook reading, and articles.
- **Coverage** (`/coverage`): sessions × GTL sections, or × URPS Blueprint domains.
- **Reading list** (`/library`): every assigned article once, with PubMed links, plus Walters chapter coverage.

## Develop

Needs [Deno](https://deno.com) 2.x.

```sh
deno task dev     # Vite dev server with hot reload
deno task test    # data integrity tests
deno task check   # type-check
deno task build   # production build to _fresh/
deno task start   # serve the build (port via --port, default 8000)
```

## Content

`data/curriculum.json` is the single source of the site's content. Edit it directly and rebuild.
`scripts/extract.py` was the one-time import from `URPS_Didactic_Schedule.xlsx` and the GTL mapping PDF
(plus PubMed metadata for every PMID); re-running it overwrites manual edits to the JSON.

## Deploy

Runs on the same VPS as urogyn.xenoj.com, behind Caddy and Cloudflare, on port 8001. See
[deploy/README.md](deploy/README.md).
