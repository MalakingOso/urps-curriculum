import { Fragment } from "preact";
import { useSignal } from "@preact/signals";
import type { GtlSection, LibraryEntry, TextbookChapter } from "../lib/curriculum.ts";
import { currentQuery, matchesQuery } from "../lib/search.ts";
import ArticleItem from "../components/ArticleItem.tsx";

const pad = (n: number) => String(n).padStart(2, "0");
type Sort = "order" | "new" | "old" | "journal";

interface Props {
  entries: LibraryEntry[];
  other: { citation: string; sessions: number[] }[];
  chapters: Record<number, { number: number; title: string }[]>;
  chapterTitles: TextbookChapter[];
  gtlSections: GtlSection[];
  initialQ: string;
}

export default function Library({ entries, other, chapters, chapterTitles, gtlSections, initialQ }: Props) {
  const sort = useSignal<Sort>("order");
  const gtl = useSignal("");
  const free = useSignal(false);
  // Start on an example (the lowest-numbered of the most-assigned chapters) so the detail line explains the grid.
  const assigned = Object.keys(chapters).map(Number);
  const most = Math.max(...assigned.map((c) => chapters[c].length));
  const ch = useSignal(Math.min(...assigned.filter((c) => chapters[c].length === most)));
  const q = currentQuery(initialQ);

  const sorters: Record<Sort, (a: LibraryEntry, b: LibraryEntry) => number> = {
    order: (a, b) => a.sessions[0].number - b.sessions[0].number,
    new: (a, b) => (b.article.pubmed?.year ?? 0) - (a.article.pubmed?.year ?? 0),
    old: (a, b) => (a.article.pubmed?.year ?? 0) - (b.article.pubmed?.year ?? 0),
    journal: (a, b) => (a.article.pubmed?.journal ?? "").localeCompare(b.article.pubmed?.journal ?? ""),
  };
  const items = entries
    .filter((e) =>
      (!free.value || e.article.pubmed?.pmcid) &&
      (!gtl.value || e.sessions.some((s) => s.gtl.includes(gtl.value))) &&
      matchesQuery(
        [e.article.citation, e.article.pubmed?.title, e.article.pubmed?.journal, ...e.sessions.map((s) => s.title)]
          .join(" ").toLowerCase(),
        q,
      )
    )
    .sort(sorters[sort.value]);
  const chSel = ch.value ? chapters[ch.value] : null;
  const chTitle = (c: number) => chapterTitles.find((t) => t.number === c)?.title ?? `Chapter ${c}`;

  return (
    <>
      <section class="walters">
        <h2>
          Textbook chapters to read <span class="muted">Walters &amp; Karam, 5th ed.</span>
        </h2>
        <p class="lead">
          Each square is a chapter of the course textbook. {assigned.length} of {chapterTitles.length} are assigned
          reading for at least one session; darker squares are assigned more often. Select a chapter to see its title
          and sessions.
        </p>
        <div class="chapters" role="list">
          {chapterTitles.map(({ number: c, title }) => {
            const ss = chapters[c];
            return ss
              ? (
                <button
                  key={c}
                  type="button"
                  role="listitem"
                  class={`ch on ${ch.value === c ? "sel" : ""}`}
                  style={`--n:${Math.min(ss.length, 4)}`}
                  title={`Ch. ${c}: ${title}`}
                  aria-pressed={ch.value === c}
                  onClick={() => (ch.value = ch.value === c ? 0 : c)}
                >
                  {c}
                </button>
              )
              : <span key={c} role="listitem" class="ch" title={`Ch. ${c}: ${title} (not assigned)`}>{c}</span>;
          })}
        </div>
        <p class="ch-legend">
          <span><i class="ch-key" style="--n:1" />1 session</span>
          <span><i class="ch-key" style="--n:2" />2</span>
          <span><i class="ch-key" style="--n:4" />3 or more</span>
          <span><i class="ch-key off" />Not assigned</span>
        </p>
        <div class="ch-detail" aria-live="polite">
          {chSel
            ? (
              <>
                <span class="ch-num">Chapter {ch.value}</span>
                <span class="ch-title">{chTitle(ch.value)}</span>
                <span class="in">
                  Assigned reading for{" "}
                  {chSel.map((s, i) => (
                    <Fragment key={s.number}>
                      {i > 0 && ", "}
                      <a href={`/sessions/${s.number}`} title={s.title}>Session {pad(s.number)}</a>
                    </Fragment>
                  ))}
                </span>
              </>
            )
            : <span class="in">Select a chapter to see its title and the sessions that assign it.</span>}
        </div>
      </section>

      <section class="articles">
        <h2>
          Articles to read <span class="muted">Peer-reviewed, linked to PubMed</span>
        </h2>
        <p class="lead">
          The primary and further readings from every session. An article assigned in more than one session is
          listed once, with each session that assigns it.
        </p>
      <div class="filters">
        <label class="select">
          <span>Sort</span>
          <select id="lib-sort" value={sort.value} onChange={(e) => (sort.value = e.currentTarget.value as Sort)}>
            <option value="order">Curriculum order</option>
            <option value="new">Newest first</option>
            <option value="old">Oldest first</option>
            <option value="journal">Journal</option>
          </select>
        </label>
        <label class="select">
          <span>GTL section</span>
          <select id="lib-gtl" value={gtl.value} onChange={(e) => (gtl.value = e.currentTarget.value)}>
            <option value="">All sections</option>
            {gtlSections.map((g) => <option key={g.key} value={g.key}>{g.name}</option>)}
          </select>
        </label>
        <label class="check">
          <input
            id="lib-free"
            type="checkbox"
            checked={free.value}
            onChange={(e) => (free.value = e.currentTarget.checked)}
          />{" "}
          Free full text only
        </label>
      </div>
      <p class="count" aria-live="polite">{items.length} articles</p>
      <ul class="arts library">
        {items.map((e) => (
          <ArticleItem key={e.article.pmid!} article={e.article} role={e.roles.join(" + ")}>
            <span class="in">
              Assigned in{" "}
              {e.sessions.map((s, i) => (
                <Fragment key={s.number}>
                  {i > 0 && ", "}
                  <a href={`/sessions/${s.number}`} title={s.title}>Session {pad(s.number)}</a>
                </Fragment>
              ))}
            </span>
          </ArticleItem>
        ))}
      </ul>
      </section>
      <section class="other">
        <h2>Other resources</h2>
        <ul>
          {other.map((o) => (
            <li key={o.citation}>
              {o.citation} <span class="muted">· sessions {o.sessions.join(", ")}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
