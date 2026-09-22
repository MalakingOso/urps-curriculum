import { assert, assertEquals } from "@std/assert";
import { libraryEntries, summaries } from "../lib/curriculum.ts";
import { matchesQuery, searchable } from "../lib/search.ts";

const sessionsFor = (q: string) => summaries.filter((s) => matchesQuery(s.text, q)).map((s) => s.number);
const articlesFor = (q: string) =>
  libraryEntries().entries.filter((e) => matchesQuery(e.text, q)).map((e) => e.article.pubmed?.title ?? "");

Deno.test("synonyms: 'microscopic hematuria' finds the AUA Microhematuria guideline", () => {
  assert(articlesFor("microscopic hematuria").some((t) => t.startsWith("Microhematuria")));
  assert(sessionsFor("microscopic hematuria").includes(28));
  assert(articlesFor("hematuria").some((t) => t.startsWith("Microhematuria")));
});

Deno.test("abbreviations and spelled-out terms find each other", () => {
  for (const n of [6, 7, 48]) assert(sessionsFor("overactive bladder").includes(n));
  assert(sessionsFor("stress urinary incontinence").includes(4));
  assert(sessionsFor("interstitial cystitis").includes(34));
  assert(sessionsFor("sacral neuromodulation").includes(7));
});

Deno.test("punctuation, accents and plurals are ignored", () => {
  assert(sessionsFor("gender affirming").includes(36));
  assert(sessionsFor("BPS IC").includes(55));
  assert(sessionsFor("fistulas").includes(25));
  assertEquals(searchable(["Kurtuluş"]).trim(), "kurtulus");
});

Deno.test("short words match whole words or word starts", () => {
  const text = searchable(["AUA guideline on suture"]);
  assert(!matchesQuery(text, "ui"));
  assert(matchesQuery(searchable(["Mixed UI"]), "ui"));
  assert(!matchesQuery(searchable(["Vesicovaginal fistula"]), "fi"));
});
