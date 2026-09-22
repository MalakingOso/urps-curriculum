import { signal } from "@preact/signals";
import { IS_BROWSER } from "fresh/runtime";
import { SYNONYMS } from "./synonyms.ts";

// Shared by the header search box and whichever list island is on the page. Islands read
// `initialQ` (from the URL) on the server instead, so no request state lives in this module.
export const query = signal(IS_BROWSER ? new URL(location.href).searchParams.get("q") ?? "" : "");

export const currentQuery = (initialQ: string) => IS_BROWSER ? query.value : initialQ;

/** Lowercase, strip accents, and turn punctuation into spaces ("BPS/IC" → "bps ic"). */
export const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const GROUPS = SYNONYMS.map((g) => g.map(normalize));
const STOPWORDS = new Set(["a", "an", "and", "the", "of", "for", "in", "on", "to", "with", "or", "vs"]);

/**
 * Builds the search text for one item: normalized, space-padded so whole words can be matched
 * with " word ", and expanded with every synonym of any term it contains.
 */
export function searchable(parts: (string | null | undefined)[]): string {
  const base = ` ${normalize(parts.filter(Boolean).join(" "))} `;
  const extra = GROUPS.filter((g) => g.some((t) => base.includes(` ${t} `))).flat();
  return `${base}${extra.join(" ")} `;
}

// One- and two-letter words must be whole words ("fi" shouldn't match "fistula"), three-letter
// words must start a word ("uti" shouldn't match "cutis"), and longer ones can match anywhere, so
// "hematuria" still finds "microhematuria". A trailing plural "s" is optional.
const wordMatches = (text: string, w: string) => {
  const stem = w.length > 4 && w.endsWith("s") ? w.slice(0, -1) : w;
  if (stem.length <= 2) return text.includes(` ${stem} `);
  return stem.length === 3 ? text.includes(` ${stem}`) : text.includes(stem);
};

export const matchesQuery = (text: string, q: string) =>
  normalize(q).split(" ").filter((w) => w && !STOPWORDS.has(w)).every((w) => wordMatches(text, w));
