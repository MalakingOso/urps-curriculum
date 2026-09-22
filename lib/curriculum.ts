import data from "../data/curriculum.json" with { type: "json" };
import { searchable } from "./search.ts";

export type Kind = "clinical" | "professional" | "mock";

export interface PubmedMeta {
  title: string;
  journal: string | null;
  year: number | null;
  firstAuthor: string | null;
  pmcid: string | null;
}

export interface Article {
  citation: string;
  label: string | null;
  pmid: string | null;
  pubmed?: PubmedMeta;
}

export interface ObjectiveGroup {
  heading: string | null;
  objectives: string[];
}

export interface Session {
  number: number;
  block: number;
  kind: Kind;
  title: string;
  urpCodes: string | null;
  urpDomains: string[];
  gtlLabel: string | null;
  gtl: string[];
  description: string | null;
  objectiveGroups: ObjectiveGroup[];
  reading: string;
  waltersChapters: number[];
  primary: Article[];
  further: Article[];
}

export interface Block {
  number: number;
  year: number;
  name: string;
  sessions: [number, number];
}

export interface GtlSection {
  key: string;
  name: string;
}

export interface TextbookChapter {
  number: number;
  title: string;
}

export interface UrpDomain {
  code: string;
  name: string;
  description: string;
}

interface Curriculum {
  title: string;
  blocks: Block[];
  gtlSections: GtlSection[];
  urpDomains: UrpDomain[];
  textbookChapters: TextbookChapter[];
  sessions: Session[];
}

export const curriculum = data as unknown as Curriculum;
export const { blocks, gtlSections, urpDomains, textbookChapters, sessions } = curriculum;

export const KIND_LABEL: Record<Kind, string> = {
  clinical: "Clinical",
  professional: "Professional",
  mock: "Mock boards",
};

export const GTL_SHORT: Record<string, string> = {
  anatomy: "Anatomy",
  "ui-luts": "UI/LUTS",
  pop: "POP",
  "fi-dd": "FI/DD",
  rvf: "RVF",
  "ugf-ud": "Fistula/UD",
  gsm: "GSM",
  uti: "UTI",
  neuro: "Neuro",
  pbs: "Pain/PBS",
  periop: "Periop",
  scholarly: "Scholarly",
  enrichment: "Prof. dev",
};

export const URP_SHORT: Record<string, string> = {
  URP1: "POP",
  URP2: "Anorectal",
  URP3: "Masses",
  URP4: "UI/OAB",
  URP5: "Neurogenic",
  URP6: "UTI",
  URP7: "Pain",
  URP8: "UT injury",
  URP9: "Special",
};

export const gtlName = (key: string) => gtlSections.find((g) => g.key === key)?.name ?? key;
export const gcol = (key: string) => `var(--g-${key})`;
export const pad = (n: number) => String(n).padStart(2, "0");
export const pubmedUrl = (pmid: string) => `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
export const pmcUrl = (pmcid: string) => `https://pmc.ncbi.nlm.nih.gov/articles/${pmcid}/`;

export const getSession = (n: number) => sessions.find((s) => s.number === n);
export const blockOf = (s: Session) => blocks.find((b) => b.number === s.block)!;

/** The slice of a session the interactive islands need, plus its search text (see `searchable`). */
export interface SessionSummary {
  number: number;
  block: number;
  kind: Kind;
  title: string;
  gtl: string[];
  gtlLabel: string | null;
  urpCodes: string | null;
  urpDomains: string[];
  text: string;
}

export const summaries: SessionSummary[] = sessions.map((s) => ({
  number: s.number,
  block: s.block,
  kind: s.kind,
  title: s.title,
  gtl: s.gtl,
  gtlLabel: s.gtlLabel,
  urpCodes: s.urpCodes,
  urpDomains: s.urpDomains,
  text: searchable([
    s.title,
    s.gtlLabel,
    s.urpCodes,
    s.reading,
    s.description,
    ...s.objectiveGroups.flatMap((g) => [g.heading, ...g.objectives]),
    ...[...s.primary, ...s.further].flatMap((a) => [a.citation, a.pubmed?.title]),
  ]),
}));

export const summary = {
  sessions: sessions.length,
  clinical: sessions.filter((s) => s.kind === "clinical").length,
  professional: sessions.filter((s) => s.kind === "professional").length,
  mock: sessions.filter((s) => s.kind === "mock").length,
  articles: new Set(sessions.flatMap((s) => [...s.primary, ...s.further]).filter((a) => a.pmid).map((a) => a.pmid))
    .size,
};

export interface LibraryEntry {
  article: Article;
  roles: string[];
  sessions: { number: number; title: string; gtl: string[] }[];
  text: string;
}

/** Articles deduplicated by PMID; one assigned in several sessions appears once. */
export function libraryEntries(): { entries: LibraryEntry[]; other: { citation: string; sessions: number[] }[] } {
  const byPmid = new Map<string, LibraryEntry>();
  const other = new Map<string, number[]>();
  for (const s of sessions) {
    for (const [role, list] of [["Primary", s.primary], ["Further", s.further]] as const) {
      for (const a of list) {
        if (!a.pmid) {
          other.set(a.citation, [...(other.get(a.citation) ?? []), s.number]);
          continue;
        }
        const e = byPmid.get(a.pmid) ?? { article: a, roles: [], sessions: [], text: "" };
        if (a.label) e.article = a;
        if (!e.roles.includes(role)) e.roles.push(role);
        e.sessions.push({ number: s.number, title: s.title, gtl: s.gtl });
        byPmid.set(a.pmid, e);
      }
    }
  }
  return {
    entries: [...byPmid.values()].map((e) => ({
      ...e,
      text: searchable([e.article.citation, e.article.pubmed?.title, e.article.pubmed?.journal, ...e.sessions.map((s) => s.title)]),
    })),
    other: [...other].map(([citation, ss]) => ({ citation, sessions: ss })),
  };
}

/** Walters & Karam chapter -> sessions assigning it; `max` is the number of chapters in the book. */
export function chapterMap(): { max: number; chapters: Record<number, { number: number; title: string }[]> } {
  const chapters: Record<number, { number: number; title: string }[]> = {};
  for (const s of sessions) {
    for (const c of s.waltersChapters) (chapters[c] ??= []).push({ number: s.number, title: s.title });
  }
  return { max: textbookChapters.length, chapters };
}
