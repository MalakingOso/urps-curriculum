import { HttpError, type PageProps } from "fresh";
import { Head } from "fresh/runtime";
import { blockOf, gcol, getSession, gtlName, KIND_LABEL, pad, sessions } from "../../lib/curriculum.ts";
import ArticleItem from "../../components/ArticleItem.tsx";

export default function SessionPage({ params }: PageProps) {
  const n = Number(params.n);
  const s = /^\d+$/.test(params.n) ? getSession(n) : undefined;
  if (!s) throw new HttpError(404);
  const b = blockOf(s);
  const prev = sessions.find((x) => x.number === n - 1);
  const next = sessions.find((x) => x.number === n + 1);

  return (
    <article class="session" style={`--c:${gcol(s.gtl[0] ?? "scholarly")}`}>
      <Head>
        <title>{`${pad(s.number)} · ${s.title} · URPS Fellowship Curriculum`}</title>
      </Head>
      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="/">Curriculum</a> <span aria-hidden="true">/</span> Block {b.number} · {b.name}
      </nav>
      <header class="session-head">
        <p class="eyebrow">Session {pad(s.number)} · Year {b.year} · {KIND_LABEL[s.kind]}</p>
        <h1>{s.title}</h1>
        <div class="tags">
          {s.urpCodes && <span class="tag mono">{s.urpCodes}</span>}
          {s.gtl.map((k) => (
            <a key={k} class="tag gtl" style={`--c:${gcol(k)}`} href={`/coverage?col=${k}`}>{gtlName(k)}</a>
          ))}
        </div>
      </header>

      {s.description && <p class="lede">{s.description}</p>}

      {s.objectiveGroups.length > 0 && (
        <section class="objectives">
          <h2>Learning objectives</h2>
          {s.objectiveGroups.map((g, gi) => {
            const m = g.heading?.match(/^(.*?)\s*\((GTL[^)]*)\)$/);
            return (
              <section key={gi} class="obj-group">
                {g.heading && (
                  <h3>
                    {m ? m[1] : g.heading} {m && <span class="ref mono">{m[2]}</span>}
                  </h3>
                )}
                <ul>{g.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
              </section>
            );
          })}
        </section>
      )}

      <section class="readings">
        <h2>Reading</h2>
        <p class="textbook">{s.reading}</p>
        {s.primary.length > 0 && (
          <>
            <h3>Primary article</h3>
            <ul class="arts">{s.primary.map((a) => <ArticleItem key={a.citation} article={a} />)}</ul>
          </>
        )}
        {s.further.length > 0 && (
          <>
            <h3>Further reading</h3>
            <ul class="arts">{s.further.map((a) => <ArticleItem key={a.citation} article={a} />)}</ul>
          </>
        )}
      </section>

      <nav class="pager" aria-label="Adjacent sessions">
        {prev
          ? (
            <a href={`/sessions/${prev.number}`} class="prev">
              <span>Previous · {pad(prev.number)}</span>
              {prev.title}
            </a>
          )
          : <span />}
        {next
          ? (
            <a href={`/sessions/${next.number}`} class="next">
              <span>Next · {pad(next.number)}</span>
              {next.title}
            </a>
          )
          : <span />}
      </nav>
    </article>
  );
}
