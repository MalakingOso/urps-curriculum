import type { PageProps } from "fresh";
import SearchBox from "../islands/SearchBox.tsx";
import "../client.ts";

const TABS = [
  { href: "/", label: "Journey" },
  { href: "/coverage", label: "Coverage" },
  { href: "/library", label: "Library" },
];

export default function App({ Component, url }: PageProps) {
  const path = url.pathname;
  const current = path.startsWith("/sessions/") ? "/" : path;
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <title>URPS Fellowship Curriculum</title>
        <meta
          name="description"
          content="The 59-session URPS fellowship didactic curriculum, mapped to the AUGS Guide to Learning, the URPS Qualifying Exam Blueprint, and Walters & Karam."
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preload" href="/fonts/newsreader-latin-opsz-normal.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
        <link rel="preload" href="/fonts/geist-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
      </head>
      <body>
        <div class="app">
          <header class="top">
            <a class="brand" href="/">
              <span class="brand-kicker">URPS Fellowship</span>
              <span class="brand-name">Curriculum</span>
            </a>
            <nav class="tabs" aria-label="Sections">
              {TABS.map((t) => <a key={t.href} href={t.href} aria-current={t.href === current ? "page" : undefined}>{t.label}</a>)}
            </nav>
            <SearchBox path={path} initialQ={url.searchParams.get("q") ?? ""} />
          </header>
          <main id="view">
            <Component />
          </main>
          <footer class="foot">
            Aligned to the AUGS Guide to Learning (2024), the URPS Qualifying Exam Blueprint, and Walters &amp; Karam, 5th
            edition.
          </footer>
        </div>
      </body>
    </html>
  );
}
