import { Fragment } from "preact";
import { useSignal } from "@preact/signals";
import type { Block, GtlSection, SessionSummary, UrpDomain } from "../lib/curriculum.ts";
import { currentQuery, matchesQuery } from "../lib/search.ts";

const GTL_SHORT: Record<string, string> = {
  anatomy: "Anatomy", "ui-luts": "UI/LUTS", pop: "POP", "fi-dd": "FI/DD", rvf: "RVF", "ugf-ud": "Fistula/UD",
  gsm: "GSM", uti: "UTI", neuro: "Neuro", pbs: "Pain/PBS", periop: "Periop", scholarly: "Scholarly",
  enrichment: "Prof. dev",
};
const URP_SHORT: Record<string, string> = {
  URP1: "POP", URP2: "Anorectal", URP3: "Masses", URP4: "UI/OAB", URP5: "Neurogenic", URP6: "UTI",
  URP7: "Pain", URP8: "UT injury", URP9: "Special",
};
const pad = (n: number) => String(n).padStart(2, "0");

interface Props {
  sessions: SessionSummary[];
  blocks: Block[];
  gtlSections: GtlSection[];
  urpDomains: UrpDomain[];
  initialCol: string;
  initialQ: string;
}

interface Col {
  key: string;
  short: string;
  name: string;
  color: string;
}

export default function Coverage({ sessions, blocks, gtlSections, urpDomains, initialCol, initialQ }: Props) {
  const lens = useSignal<"gtl" | "urp">(urpDomains.some((u) => u.code === initialCol) ? "urp" : "gtl");
  const col = useSignal(initialCol);
  const q = currentQuery(initialQ);
  const gtlLens = lens.value === "gtl";

  const cols: Col[] = gtlLens
    ? gtlSections.map((g) => ({ key: g.key, short: GTL_SHORT[g.key], name: g.name, color: `var(--g-${g.key})` }))
    : urpDomains.map((u) => ({
      key: u.code,
      short: URP_SHORT[u.code],
      name: `${u.code} · ${u.name}`,
      color: `var(--u-${u.code})`,
    }));
  const has = (s: SessionSummary, k: string) => (gtlLens ? s.gtl : s.urpDomains).includes(k);
  // Sessions touching (nearly) every column are drawn as one band so they don't swamp the grid.
  const band = (s: SessionSummary) => {
    if (s.kind === "mock") return `Mock oral boards · ${s.number === 59 ? "all domains" : `reviews Block ${s.block}`}`;
    if (gtlLens && s.gtl.length >= 11) return s.gtlLabel;
    if (!gtlLens && !s.urpDomains.length) return "No Blueprint code · professional development";
    return null;
  };
  const direct = sessions.filter((s) => !band(s));
  const totals = cols.map((c) => direct.filter((s) => has(s, c.key)).length);
  const max = Math.max(...totals);
  const selected = cols.find((c) => c.key === col.value);
  const setLens = (l: "gtl" | "urp") => {
    lens.value = l;
    col.value = "";
  };

  return (
    <>
      <div class="filters">
        <div class="seg" role="group" aria-label="Columns">
          <button type="button" aria-pressed={gtlLens} onClick={() => setLens("gtl")}>GTL sections</button>
          <button type="button" aria-pressed={!gtlLens} onClick={() => setLens("urp")}>URP Blueprint</button>
        </div>
        {q && <p class="count">Filtered by “{q}”</p>}
      </div>

      {selected && (
        <aside class="col-panel" style={`--c:${selected.color}`}>
          <header>
            <h2>{selected.name}</h2>
            <button type="button" class="close" onClick={() => (col.value = "")}>Clear</button>
          </header>
          <p>{direct.filter((s) => has(s, selected.key)).length} sessions teach this directly:</p>
          <ol>
            {direct.filter((s) => has(s, selected.key)).map((s) => (
              <li key={s.number}>
                <a href={`/sessions/${s.number}`}>
                  <span class="num">{pad(s.number)}</span> {s.title}
                </a>
              </li>
            ))}
          </ol>
        </aside>
      )}

      <div class="heat-wrap" tabindex={0} aria-label="Coverage grid, scrolls sideways">
        <table class="heat">
          <thead>
            <tr>
              <th scope="col" class="corner">Session</th>
              {cols.map((c) => (
                <th key={c.key} scope="col" class={`colh ${col.value === c.key ? "sel" : ""}`} style={`--c:${c.color}`}>
                  <button
                    type="button"
                    title={c.name}
                    aria-pressed={col.value === c.key}
                    onClick={() => (col.value = col.value === c.key ? "" : c.key)}
                  >
                    <span>{c.short}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {blocks.map((b) => (
              <Fragment key={b.number}>
                <tr class="block-row">
                  <th colSpan={cols.length + 1} scope="rowgroup">Block {b.number} · {b.name}</th>
                </tr>
                {sessions.filter((s) => s.block === b.number).map((s) => {
                  const bt = band(s);
                  return (
                    <tr key={s.number} class={`kind-${s.kind}`} hidden={!matchesQuery(s.text, q)}>
                      <th scope="row">
                        <a href={`/sessions/${s.number}`}>
                          <span class="num">{pad(s.number)}</span> {s.title}
                        </a>
                      </th>
                      {bt
                        ? (
                          <td colSpan={cols.length} class="band">
                            <span>{bt}</span>
                          </td>
                        )
                        : cols.map((c) => {
                          const sel = col.value === c.key ? "sel" : "";
                          return has(s, c.key)
                            ? (
                              <td key={c.key} class={`on ${sel}`} style={`--c:${c.color}`}>
                                <span class="vh">{c.name}</span>
                              </td>
                            )
                            : <td key={c.key} class={sel} />;
                        })}
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Sessions teaching it</th>
              {totals.map((t, i) => (
                <td key={cols[i].key} style={`--c:${cols[i].color};--h:${(t / max).toFixed(2)}`}>
                  <span class="bar" />
                  <span class="n">{t}</span>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
