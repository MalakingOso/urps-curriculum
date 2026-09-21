import type { PageProps } from "fresh";
import { blocks, gtlSections, summaries, summary } from "../lib/curriculum.ts";
import Journey from "../islands/Journey.tsx";

export default function Home({ url }: PageProps) {
  const stats: [number, string][] = [
    [summary.sessions, "sessions"],
    [summary.clinical, "clinical"],
    [summary.professional, "professional"],
    [summary.mock, "mock oral boards"],
    [summary.articles, "articles"],
  ];
  return (
    <>
      <section class="intro">
        <h1>URPS Fellowship Didactic Curriculum</h1>
        <p>
          The {summary.sessions} didactic sessions of the fellowship's two-year curriculum, mapped to the AUGS Guide to
          Learning (2024), the URPS Qualifying Exam Blueprint, and Walters &amp; Karam, 5th edition.
        </p>
        <dl class="summary">
          {stats.map(([n, label]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{n}</dd>
            </div>
          ))}
        </dl>
      </section>
      <Journey
        sessions={summaries}
        blocks={blocks}
        gtlSections={gtlSections}
        initialQ={url.searchParams.get("q") ?? ""}
      />
    </>
  );
}
