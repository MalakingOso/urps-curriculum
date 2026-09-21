import type { PageProps } from "fresh";
import { Head } from "fresh/runtime";
import { blocks, gtlSections, summaries, urpDomains } from "../lib/curriculum.ts";
import Coverage from "../islands/Coverage.tsx";

export default function CoveragePage({ url }: PageProps) {
  return (
    <>
      <Head>
        <title>Coverage · URPS Fellowship Curriculum</title>
      </Head>
      <section class="intro intro-sm">
        <h1>Coverage</h1>
        <p>
          Each row is a session and each column is a section of the AUGS Guide to Learning, or a domain of the URPS
          Qualifying Exam Blueprint. Select a column to list its sessions.
        </p>
      </section>
      <Coverage
        sessions={summaries}
        blocks={blocks}
        gtlSections={gtlSections}
        urpDomains={urpDomains}
        initialCol={url.searchParams.get("col") ?? ""}
        initialQ={url.searchParams.get("q") ?? ""}
      />
      <p class="note">
        Mock oral boards and sessions spanning nearly every section are drawn as a single band, so they don't overwhelm
        the grid. Totals count direct teaching only.
      </p>
    </>
  );
}
