import type { ComponentChildren } from "preact";
import type { Article } from "../lib/curriculum.ts";

export default function ArticleItem(
  { article: a, role, children }: { article: Article; role?: string; children?: ComponentChildren },
) {
  const m = a.pubmed;
  if (!m || !a.pmid) {
    return (
      <li class="art art-plain">
        <span class="art-title">{a.citation}</span>
        {children}
      </li>
    );
  }
  const pubmed = `https://pubmed.ncbi.nlm.nih.gov/${a.pmid}/`;
  return (
    <li class="art">
      <a class="art-title" href={pubmed} target="_blank" rel="noopener">{m.title}</a>
      <span class="art-meta">
        {a.label && <><b>{a.label}</b> ·{" "}</>}
        {m.firstAuthor} · <i>{m.journal}</i> {m.year}
      </span>
      <span class="art-links">
        {role && <span class="role">{role}</span>}
        <a href={pubmed} target="_blank" rel="noopener" class="mono">PMID {a.pmid}</a>
        {m.pmcid && (
          <a href={`https://pmc.ncbi.nlm.nih.gov/articles/${m.pmcid}/`} target="_blank" rel="noopener" class="free">
            Free full text
          </a>
        )}
      </span>
      {children}
    </li>
  );
}
