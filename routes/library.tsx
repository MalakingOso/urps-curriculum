import type { PageProps } from "fresh";
import { Head } from "fresh/runtime";
import { chapterMap, gtlSections, libraryEntries, textbookChapters } from "../lib/curriculum.ts";
import Library from "../islands/Library.tsx";

const { entries, other } = libraryEntries();
const { chapters } = chapterMap();

export default function LibraryPage({ url }: PageProps) {
  return (
    <>
      <Head>
        <title>Reading list · URPS Fellowship Curriculum</title>
      </Head>
      <section class="intro intro-sm">
        <h1>Reading list</h1>
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
