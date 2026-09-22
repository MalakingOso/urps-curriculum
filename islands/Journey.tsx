import { useSignal } from "@preact/signals";
import { type Block, type GtlSection, type Kind, KIND_LABEL, KINDS, type SessionSummary } from "../lib/curriculum.ts";
import { currentQuery, matchesQuery } from "../lib/search.ts";

const pad = (n: number) => String(n).padStart(2, "0");

interface Props {
  sessions: SessionSummary[];
  blocks: Block[];
  gtlSections: GtlSection[];
  initialQ: string;
}

export default function Journey({ sessions, blocks, gtlSections, initialQ }: Props) {
  const kind = useSignal<Kind | "all">("all");
  const gtl = useSignal("");
  const q = currentQuery(initialQ);
  const gtlName = Object.fromEntries(gtlSections.map((g) => [g.key, g.name]));

  const matches = (s: SessionSummary) =>
    matchesQuery(s.text, q) && (kind.value === "all" || s.kind === kind.value) &&
    (!gtl.value || s.gtl.includes(gtl.value));
  const shown = sessions.filter(matches).length;

  return (
    <>
      <div class="filters" role="group" aria-label="Filters">
        <div class="seg" role="group" aria-label="Session type">
          {(["all", ...KINDS] as const).map((k) => (
            <button key={k} type="button" aria-pressed={kind.value === k} onClick={() => (kind.value = k)}>
              {k === "all" ? "All" : KIND_LABEL[k]}
            </button>
          ))}
        </div>
        <label class="select">
          <span>GTL section</span>
          <select id="gtl-filter" value={gtl.value} onChange={(e) => (gtl.value = e.currentTarget.value)}>
            <option value="">All sections</option>
            {gtlSections.map((g) => <option key={g.key} value={g.key}>{g.name}</option>)}
          </select>
        </label>
      </div>
      <p class="count" aria-live="polite">
        {shown === sessions.length ? `All ${sessions.length} sessions` : `${shown} of ${sessions.length} sessions match`}
      </p>
      <div class="blocks">
        {blocks.map((b) => {
          const list = sessions.filter((s) => s.block === b.number);
          const n = (k: Kind) => list.filter((s) => s.kind === k).length;
          return (
            <section key={b.number} class="block">
              <header class="block-head">
                <p class="eyebrow">Year {b.year} · Block {b.number} · Sessions {b.sessions[0]}–{b.sessions[1]}</p>
                <h2>{b.name}</h2>
                <p class="block-stats">
                  {[`${list.length} sessions`, ...KINDS.filter((k) => n(k)).map((k) => `${n(k)} ${KIND_LABEL[k].toLowerCase()}`)]
                    .join(" · ")}
                </p>
              </header>
              <ol class="toc">
                {list.map((s) => (
                  <li key={s.number} class={matches(s) ? "" : "dim"}>
                    <a href={`/sessions/${s.number}`} class={`row kind-${s.kind}`}>
                      <span class="num">{pad(s.number)}</span>
                      <span class="t">
                        <span class="title">{s.title}</span>
                        <span class="sub">
                          {s.gtlLabel ?? "Comprehensive oral examination"}
                          {s.urpCodes && <>{" · "}<span class="mono">{s.urpCodes}</span></>}
                        </span>
                      </span>
                      <span class={`kind kind-${s.kind}`}>{KIND_LABEL[s.kind]}</span>
                      <span class="dots" aria-label={s.gtl.map((k) => gtlName[k]).join(", ")}>
                        {s.gtl.map((k) => <i key={k} style={`--c:var(--g-${k})`} />)}
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </>
  );
}
