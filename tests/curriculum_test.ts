import { assert, assertEquals } from "@std/assert";
import { blocks, chapterMap, gtlSections, libraryEntries, sessions, summary, textbookChapters } from "../lib/curriculum.ts";

Deno.test("session counts by type", () => {
  assertEquals(summary.sessions, 60);
  assertEquals(summary.kinds, { surgical: 20, office: 23, imaging: 2, anatomy: 3, professional: 8, mock: 4 });
  assertEquals(sessions.map((s) => s.number), Array.from({ length: 60 }, (_, i) => i + 1));
});

Deno.test("blocks cover sessions contiguously", () => {
  assertEquals(blocks.map((b) => b.sessions), [[1, 16], [17, 30], [31, 46], [47, 60]]);
  for (const s of sessions) {
    const b = blocks.find((x) => x.number === s.block)!;
    assert(s.number >= b.sessions[0] && s.number <= b.sessions[1], `session ${s.number} outside block ${b.number}`);
  }
});

Deno.test("every session maps to known GTL sections", () => {
  const keys = new Set(gtlSections.map((g) => g.key));
  for (const s of sessions) {
    assert(s.gtl.length > 0, `session ${s.number} has no GTL section`);
    for (const k of s.gtl) assert(keys.has(k), `session ${s.number}: unknown GTL key ${k}`);
  }
});

Deno.test("library lists each PMID once, with every session that assigns it", () => {
  const { entries } = libraryEntries();
  const pmids = entries.map((e) => e.article.pmid);
  assertEquals(new Set(pmids).size, pmids.length);
  assertEquals(entries.length, summary.articles);
  const value = entries.find((e) => e.article.pmid === "22551104")!;
  assertEquals(value.sessions.map((s) => s.number), [4, 8]);
  assertEquals(value.article.label, "VALUE Trial");
});

Deno.test("every PMID article has baked PubMed metadata", () => {
  for (const s of sessions) {
    for (const a of [...s.primary, ...s.further]) {
      if (a.pmid) assert(a.pubmed?.title, `session ${s.number}: PMID ${a.pmid} has no metadata`);
    }
  }
});

Deno.test("chapter map is consistent with session readings", () => {
  const { chapters, max } = chapterMap();
  assertEquals(max, textbookChapters.length);
  assertEquals(textbookChapters.map((c) => c.number), Array.from({ length: max }, (_, i) => i + 1));
  for (const c of Object.keys(chapters)) assert(Number(c) <= max, `chapter ${c} is not in the textbook`);
  assertEquals(chapters[1].map((s) => s.number), [1]);
});
