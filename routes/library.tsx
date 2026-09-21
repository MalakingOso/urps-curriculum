import type { PageProps } from "fresh";
import { Head } from "fresh/runtime";
import { chapterMap, gtlSections, libraryEntries, textbookChapters } from "../lib/curriculum.ts";
import Library from "../islands/Library.tsx";

const { entries, other } = libraryEntries();
const { max, chapters } = chapterMap();

export default function LibraryPage({ url }: PageProps) {
  return (
    <>
      <Head>
        <title>Reading list · URPS Fellowship Curriculum</title>
      </Head>
      <section class="intro intro-sm">
        <h1>Reading list</h1>
        <p>
          {entries.length} peer-reviewed articles and {Object.keys(chapters).length} of {max}{" "}
          Walters &amp; Karam chapters. Articles assigned in more than one session are listed once.
        </p>
      </section>
      <Library
        entries={entries}
        other={other}
        chapters={chapters}
        chapterTitles={textbookChapters}
        gtlSections={gtlSections}
        initialQ={url.searchParams.get("q") ?? ""}
      />
    </>
  );
}
