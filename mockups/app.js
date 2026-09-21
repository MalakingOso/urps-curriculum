(() => {
  const D = JSON.parse(document.getElementById("data").textContent);
  const app = document.querySelector(".app");
  const SKIN = app.dataset.skin;
  const view = document.getElementById("view");
  const qInput = document.getElementById("q");

  const GTL = Object.fromEntries(D.gtlSections.map((g) => [g.key, g.name]));
  const GTL_SHORT = {
    anatomy: "Anatomy", "ui-luts": "UI/LUTS", pop: "POP", "fi-dd": "FI/DD", rvf: "RVF",
    "ugf-ud": "Fistula/UD", gsm: "GSM", uti: "UTI", neuro: "Neuro", pbs: "Pain/PBS",
    periop: "Periop", scholarly: "Scholarly", enrichment: "Prof. dev",
  };
  const URP_SHORT = {
    URP1: "POP", URP2: "Anorectal", URP3: "Masses", URP4: "UI/OAB", URP5: "Neurogenic",
    URP6: "UTI", URP7: "Pain", URP8: "UT injury", URP9: "Special",
  };
  const KIND = { clinical: "Clinical", professional: "Professional", mock: "Mock boards" };
  const BLOCK = Object.fromEntries(D.blocks.map((b) => [b.number, b]));
  const S = D.sessions;

  const state = { q: "", kind: "all", gtl: "", lens: "gtl", col: "", free: false, sort: "order", ch: 0 };

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const pad = (n) => String(n).padStart(2, "0");
  const gcol = (k) => `var(--g-${k})`;
  const pubmed = (id) => `https://pubmed.ncbi.nlm.nih.gov/${id}/`;
  const pmc = (id) => `https://pmc.ncbi.nlm.nih.gov/articles/${id}/`;

  for (const s of S) {
    s._text = [
      s.title, s.gtlLabel, s.urpCodes, s.reading, s.description,
      ...s.objectiveGroups.flatMap((g) => [g.heading, ...g.objectives]),
      ...[...s.primary, ...s.further].flatMap((a) => [a.citation, a.pubmed?.title]),
    ].join(" ").toLowerCase();
  }

  const matches = (s) =>
    (!state.q || state.q.split(/\s+/).every((w) => s._text.includes(w))) &&
    (state.kind === "all" || s.kind === state.kind) &&
    (!state.gtl || s.gtl.includes(state.gtl));

  const dots = (s) =>
    `<span class="dots" aria-label="${esc(s.gtl.map((k) => GTL[k]).join(", "))}">${
      s.gtl.map((k) => `<i style="--c:${gcol(k)}"></i>`).join("")}</span>`;

  const stripe = (s) =>
    `<span class="stripe" aria-hidden="true">${s.gtl.map((k) => `<i style="--c:${gcol(k)}"></i>`).join("")}</span>`;

  const kindChip = (s) => `<span class="kind kind-${s.kind}">${KIND[s.kind]}</span>`;

  const summary = () => {
    const arts = new Set(S.flatMap((s) => [...s.primary, ...s.further]).filter((a) => a.pmid).map((a) => a.pmid));
    const c = (k) => S.filter((s) => s.kind === k).length;
    const items = [
      [S.length, "sessions"], [c("clinical"), "clinical"], [c("professional"), "professional"],
      [c("mock"), "mock oral boards"], [arts.size, "articles"],
    ];
    return `<dl class="summary">${items.map(([n, l]) => `<div><dt>${l}</dt><dd>${n}</dd></div>`).join("")}</dl>`;
  };

  const filterBar = (withKind = true) => `
    <div class="filters" role="group" aria-label="Filters">
      ${withKind ? `<div class="seg" role="radiogroup" aria-label="Session type">${
        ["all", "clinical", "professional", "mock"].map((k) =>
          `<button type="button" data-kind="${k}" aria-pressed="${state.kind === k}">${k === "all" ? "All" : KIND[k]}</button>`).join("")
      }</div>` : ""}
      <label class="select"><span>GTL section</span>
        <select id="gtl-filter" data-act="gtl">
          <option value="">All sections</option>
          ${D.gtlSections.map((g) => `<option value="${g.key}" ${state.gtl === g.key ? "selected" : ""}>${esc(g.name)}</option>`).join("")}
        </select>
      </label>
    </div>`;

  const blockHead = (b, list) => {
    const n = (k) => list.filter((s) => s.kind === k).length;
    const keys = D.gtlSections.map((g) => g.key)
      .map((k) => [k, list.filter((s) => s.kind !== "mock" && s.gtl.includes(k)).length])
      .filter(([, c]) => c).sort((a, z) => z[1] - a[1]).slice(0, 4).map(([k]) => k);
    const cover = `<div class="cover" aria-hidden="true" style="${keys.map((k, i) => `--k${i}:${gcol(k)}`).join(";")}">
      <span class="cover-n">${b.number}</span><span class="cover-y">Year ${b.year}</span></div>`;
    return `${cover}<header class="block-head">
      <p class="eyebrow">Year ${b.year} · Block ${b.number} · Sessions ${b.sessions[0]}–${b.sessions[1]}</p>
      <h2>${esc(b.name)}</h2>
      <p class="block-stats">${list.length} sessions · ${n("clinical")} clinical · ${n("professional")} professional · ${n("mock")} mock</p>
    </header>`;
  };

  // ---------- Journey ----------
  function journeyList(b, list) {
    return `<ol class="toc">${list.map((s) => `
      <li class="${matches(s) ? "" : "dim"}"><a href="#/session/${s.number}" class="row kind-${s.kind}">
        <span class="num">${pad(s.number)}</span>
        <span class="t"><span class="title">${esc(s.title)}</span>
          <span class="sub">${esc(s.gtlLabel ?? "Comprehensive oral examination")}${s.urpCodes ? ` · <span class="mono">${esc(s.urpCodes)}</span>` : ""}</span></span>
        ${s.kind !== "clinical" ? kindChip(s) : ""}
        ${dots(s)}
      </a></li>`).join("")}</ol>`;
  }

  function journeyCards(b, list) {
    return `<ol class="cards">${list.map((s) => `
      <li class="${matches(s) ? "" : "dim"}"><a href="#/session/${s.number}" class="card kind-${s.kind}">
        ${stripe(s)}
        <span class="card-top"><span class="num">${pad(s.number)}</span>${kindChip(s)}</span>
        <span class="title">${esc(s.title)}</span>
        <span class="sub mono">${esc(s.urpCodes ?? s.gtlLabel ?? "All GTL domains")}</span>
      </a></li>`).join("")}</ol>`;
  }

  function journeyTrail(b, list) {
    const width = Math.max(300, view.clientWidth || 360);
    const rowH = 132, r = 46, padX = r + 26, padY = 34;
    const per = Math.max(3, Math.min(7, Math.floor((width - 2 * padX) / 118) + 1));
    const step = (width - 2 * padX) / (per - 1);
    const pts = list.map((s, i) => {
      const row = Math.floor(i / per), col = i % per;
      const x = padX + (row % 2 ? per - 1 - col : col) * step;
      return { s, x, y: padY + row * rowH, row };
    });
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i], q = pts[i - 1];
      if (p.row !== q.row) {
        const right = q.row % 2 === 0;
        d += ` C ${q.x + (right ? r * 1.6 : -r * 1.6)} ${q.y}, ${p.x + (right ? r * 1.6 : -r * 1.6)} ${p.y}, ${p.x} ${p.y}`;
      } else d += ` L ${p.x} ${p.y}`;
    }
    const h = pts[pts.length - 1].y + 86;
    const lw = Math.min(step - 10, 128);
    return `<div class="trail" style="height:${h}px">
      <svg width="${width}" height="${h}" viewBox="0 0 ${width} ${h}" aria-hidden="true">
        <path d="${d}" class="trail-bed"/><path d="${d}" class="trail-line"/>
      </svg>
      ${pts.map(({ s, x, y }) => `
        <a href="#/session/${s.number}" class="stop kind-${s.kind} ${matches(s) ? "" : "dim"}"
           style="left:${x}px;top:${y}px;--c:${gcol(s.gtl[0] ?? "scholarly")};--lw:${lw}px"
           title="${esc(s.title)}">
          <span class="pin">${s.kind === "mock" ? "★" : s.number}</span>
          <span class="label">${esc(s.title)}</span>
        </a>`).join("")}
    </div>`;
  }

  function renderJourney() {
    const body = { app: journeyCards, warm: journeyTrail }[SKIN] ?? journeyList;
    const shown = S.filter(matches).length;
    view.innerHTML = `
      <section class="intro">
        <h1>URPS Fellowship Didactic Curriculum</h1>
        <p>The 59 didactic sessions of the fellowship's two-year curriculum, mapped to the AUGS Guide to Learning (2024),
        the URPS Qualifying Exam Blueprint, and Walters &amp; Karam, 5th edition.</p>
        ${summary()}
      </section>
      ${filterBar()}
      <p class="count" aria-live="polite">${shown === S.length ? "All 59 sessions" : `${shown} of 59 sessions match`}</p>
      <div class="blocks">${D.blocks.map((b) => {
        const list = S.filter((s) => s.block === b.number);
        return `<section class="block">${blockHead(b, list)}${body(b, list)}</section>`;
      }).join("")}</div>`;
  }

  // ---------- Session ----------
  function articleItem(a, role) {
    const m = a.pubmed;
    if (!m) return `<li class="art art-plain"><span class="art-title">${esc(a.citation)}</span></li>`;
    return `<li class="art">
      <a class="art-title" href="${pubmed(a.pmid)}" target="_blank" rel="noopener">${esc(m.title)}</a>
      <span class="art-meta">${a.label ? `<b>${esc(a.label)}</b> · ` : ""}${esc(m.firstAuthor)} · <i>${esc(m.journal)}</i> ${m.year}</span>
      <span class="art-links">
        ${role ? `<span class="role">${role}</span>` : ""}
        <a href="${pubmed(a.pmid)}" target="_blank" rel="noopener" class="mono">PMID ${a.pmid}</a>
        ${m.pmcid ? `<a href="${pmc(m.pmcid)}" target="_blank" rel="noopener" class="free">Free full text</a>` : ""}
      </span>
    </li>`;
  }

  function renderSession(n) {
    const s = S.find((x) => x.number === n);
    if (!s) return (location.hash = "#/");
    const b = BLOCK[s.block], prev = S[n - 2], next = S[n];
    const groups = s.objectiveGroups.map((g) => {
      const m = g.heading?.match(/^(.*?)\s*\((GTL[^)]*)\)$/);
      const name = m ? m[1] : g.heading, ref = m ? m[2] : "";
      return `<section class="obj-group">
        ${g.heading ? `<h3>${esc(name)} ${ref ? `<span class="ref mono">${esc(ref)}</span>` : ""}</h3>` : ""}
        <ul>${g.objectives.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>
      </section>`;
    }).join("");
    view.innerHTML = `
      <article class="session" style="--c:${gcol(s.gtl[0] ?? "scholarly")}">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Journey</a> <span aria-hidden="true">/</span> Block ${b.number} · ${esc(b.name)}</nav>
        <header class="session-head">
          <p class="eyebrow">Session ${pad(s.number)} · Year ${b.year} · ${KIND[s.kind]}</p>
          <h1>${esc(s.title)}</h1>
          <div class="tags">
            ${s.urpCodes ? `<span class="tag mono">${esc(s.urpCodes)}</span>` : ""}
            ${s.gtl.map((k) => `<a class="tag gtl" style="--c:${gcol(k)}" href="#/coverage" data-col="${k}">${esc(GTL[k])}</a>`).join("")}
          </div>
        </header>
        ${s.description ? `<p class="lede">${esc(s.description)}</p>` : ""}
        ${groups ? `<section class="objectives"><h2>Learning objectives</h2>${groups}</section>` : ""}
        <section class="readings">
          <h2>Reading</h2>
          <p class="textbook">${esc(s.reading)}</p>
          ${s.primary.length ? `<h3>Primary article</h3><ul class="arts">${s.primary.map((a) => articleItem(a)).join("")}</ul>` : ""}
          ${s.further.length ? `<h3>Further reading</h3><ul class="arts">${s.further.map((a) => articleItem(a)).join("")}</ul>` : ""}
        </section>
        <nav class="pager" aria-label="Adjacent sessions">
          ${prev ? `<a href="#/session/${prev.number}" class="prev"><span>Previous · ${pad(prev.number)}</span>${esc(prev.title)}</a>` : "<span></span>"}
          ${next ? `<a href="#/session/${next.number}" class="next"><span>Next · ${pad(next.number)}</span>${esc(next.title)}</a>` : "<span></span>"}
        </nav>
      </article>`;
  }

  // ---------- Coverage ----------
  function renderCoverage() {
    const gtlLens = state.lens === "gtl";
    const cols = gtlLens
      ? D.gtlSections.map((g) => ({ key: g.key, short: GTL_SHORT[g.key], name: g.name, color: gcol(g.key) }))
      : D.urpDomains.map((u) => ({ key: u.code, short: URP_SHORT[u.code], name: `${u.code} · ${u.name}`, color: `var(--u-${u.code})` }));
    const has = (s, k) => (gtlLens ? s.gtl : s.urpDomains).includes(k);
    const band = (s) => {
      if (s.kind === "mock") return `Mock oral boards · ${s.number === 59 ? "all domains" : `reviews Block ${s.block}`}`;
      if (gtlLens && s.gtl.length >= 11) return s.gtlLabel;
      if (!gtlLens && !s.urpDomains.length) return "No Blueprint code · professional development";
      return null;
    };
    const direct = S.filter((s) => !band(s));
    const totals = cols.map((c) => direct.filter((s) => has(s, c.key)).length);
    const max = Math.max(...totals);
    const colSel = cols.find((c) => c.key === state.col);
    const rows = D.blocks.map((b) => `
      <tr class="block-row"><th colspan="${cols.length + 1}" scope="rowgroup">Block ${b.number} · ${esc(b.name)}</th></tr>
      ${S.filter((s) => s.block === b.number).map((s) => {
        const bt = band(s);
        const hidden = state.q && !matches({ ...s, kind: s.kind }) ? "hidden" : "";
        return `<tr class="kind-${s.kind}" ${hidden}>
          <th scope="row"><a href="#/session/${s.number}"><span class="num">${pad(s.number)}</span> ${esc(s.title)}</a></th>
          ${bt ? `<td colspan="${cols.length}" class="band"><span>${esc(bt)}</span></td>`
            : cols.map((c) => has(s, c.key)
              ? `<td class="on ${state.col === c.key ? "sel" : ""}" style="--c:${c.color}"><span class="vh">${esc(c.name)}</span></td>`
              : `<td class="${state.col === c.key ? "sel" : ""}"></td>`).join("")}
        </tr>`;
      }).join("")}`).join("");

    view.innerHTML = `
      <section class="intro intro-sm">
        <h1>Coverage</h1>
        <p>Each row is a session and each column is a ${gtlLens ? "section of the AUGS Guide to Learning" : "domain of the URPS Qualifying Exam Blueprint"}.
        Select a column to list its sessions.</p>
      </section>
      <div class="filters">
        <div class="seg" role="radiogroup" aria-label="Columns">
          <button type="button" data-lens="gtl" aria-pressed="${gtlLens}">GTL sections</button>
          <button type="button" data-lens="urp" aria-pressed="${!gtlLens}">URP Blueprint</button>
        </div>
        ${state.q ? `<p class="count">Filtered by “${esc(state.q)}”</p>` : ""}
      </div>
      ${colSel ? colPanel(colSel, has) : ""}
      <div class="heat-wrap" tabindex="0" aria-label="Coverage grid, scrolls sideways">
        <table class="heat">
          <thead><tr><th scope="col" class="corner">Session</th>${cols.map((c, i) => `
            <th scope="col" class="colh ${state.col === c.key ? "sel" : ""}" style="--c:${c.color}">
              <button type="button" data-col="${c.key}" title="${esc(c.name)}"><span>${esc(c.short)}</span></button>
            </th>`).join("")}</tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr><th scope="row">Sessions teaching it</th>${totals.map((t, i) => `
            <td style="--c:${cols[i].color};--h:${(t / max).toFixed(2)}"><span class="bar"></span><span class="n">${t}</span></td>`).join("")}</tr></tfoot>
        </table>
      </div>
      <p class="note">Mock oral boards and sessions spanning nearly every section are drawn as a single band, so they don't
      overwhelm the grid. Totals count direct teaching only.</p>`;
  }

  function colPanel(c, has) {
    const list = S.filter((s) => has(s, c.key));
    return `<aside class="col-panel" style="--c:${c.color}">
      <header><h2>${esc(c.name)}</h2><button type="button" data-col="" class="close">Clear</button></header>
      <p>${list.length} sessions teach this directly:</p>
      <ol>${list.map((s) => `<li><a href="#/session/${s.number}"><span class="num">${pad(s.number)}</span> ${esc(s.title)}</a></li>`).join("")}</ol>
    </aside>`;
  }

  // ---------- Library ----------
  function renderLibrary() {
    const byPmid = new Map(), other = new Map();
    for (const s of S) {
      for (const [role, arr] of [["Primary", s.primary], ["Further", s.further]]) {
        for (const a of arr) {
          if (!a.pmid) {
            if (!other.has(a.citation)) other.set(a.citation, []);
            other.get(a.citation).push(s);
            continue;
          }
          if (!byPmid.has(a.pmid)) byPmid.set(a.pmid, { a, sessions: [], roles: new Set() });
          const e = byPmid.get(a.pmid);
          e.sessions.push(s);
          e.roles.add(role);
          if (a.label) e.a = a;
        }
      }
    }
    let items = [...byPmid.values()].filter((e) =>
      (!state.free || e.a.pubmed?.pmcid) &&
      (!state.gtl || e.sessions.some((s) => s.gtl.includes(state.gtl))) &&
      (!state.q || state.q.split(/\s+/).every((w) =>
        [e.a.citation, e.a.pubmed?.title, e.a.pubmed?.journal, ...e.sessions.map((s) => s.title)].join(" ").toLowerCase().includes(w))));
    const sorters = {
      order: (x, y) => x.sessions[0].number - y.sessions[0].number,
      new: (x, y) => (y.a.pubmed?.year ?? 0) - (x.a.pubmed?.year ?? 0),
      old: (x, y) => (x.a.pubmed?.year ?? 0) - (y.a.pubmed?.year ?? 0),
      journal: (x, y) => (x.a.pubmed?.journal ?? "").localeCompare(y.a.pubmed?.journal ?? ""),
    };
    items.sort(sorters[state.sort]);

    const chMap = new Map();
    for (const s of S) for (const c of s.waltersChapters) {
      if (!chMap.has(c)) chMap.set(c, []);
      chMap.get(c).push(s);
    }
    const maxCh = Math.max(...chMap.keys());
    const chSel = state.ch && chMap.get(state.ch);

    view.innerHTML = `
      <section class="intro intro-sm">
        <h1>Reading list</h1>
        <p>${byPmid.size} peer-reviewed articles and ${chMap.size} of ${maxCh} Walters &amp; Karam chapters.
        Articles assigned in more than one session appear once.</p>
      </section>
      <section class="walters">
        <h2>Walters &amp; Karam, 5th ed. <span class="muted">Chapters assigned</span></h2>
        <div class="chapters" role="list">${Array.from({ length: maxCh }, (_, i) => i + 1).map((c) => {
          const ss = chMap.get(c);
          return ss
            ? `<button type="button" role="listitem" class="ch on ${state.ch === c ? "sel" : ""}" data-ch="${c}" style="--n:${Math.min(ss.length, 4)}" title="Ch. ${c}: sessions ${ss.map((s) => s.number).join(", ")}">${c}</button>`
            : `<span role="listitem" class="ch" title="Ch. ${c}: not assigned">${c}</span>`;
        }).join("")}</div>
        <p class="ch-detail" aria-live="polite">${chSel
          ? `<b>Chapter ${state.ch}</b>, assigned in ${chSel.map((s) => `<a href="#/session/${s.number}">${pad(s.number)} ${esc(s.title)}</a>`).join(", ")}`
          : "Select a chapter to see which sessions assign it."}</p>
      </section>
      <div class="filters">
        <label class="select"><span>Sort</span>
          <select id="lib-sort" data-act="sort">
            ${[["order", "Curriculum order"], ["new", "Newest first"], ["old", "Oldest first"], ["journal", "Journal"]]
              .map(([v, l]) => `<option value="${v}" ${state.sort === v ? "selected" : ""}>${l}</option>`).join("")}
          </select></label>
        <label class="select"><span>GTL section</span>
          <select id="lib-gtl" data-act="gtl"><option value="">All sections</option>
            ${D.gtlSections.map((g) => `<option value="${g.key}" ${state.gtl === g.key ? "selected" : ""}>${esc(g.name)}</option>`).join("")}
          </select></label>
        <label class="check"><input id="lib-free" type="checkbox" data-act="free" ${state.free ? "checked" : ""}> Free full text only</label>
      </div>
      <p class="count" aria-live="polite">${items.length} articles</p>
      <ul class="arts library">${items.map((e) => articleItem(e.a, [...e.roles].join(" + ")).replace("</li>",
        `<span class="in">Assigned in ${e.sessions.map((s) => `<a href="#/session/${s.number}" title="${esc(s.title)}">Session ${pad(s.number)}</a>`).join(", ")}</span></li>`)).join("")}</ul>
      <section class="other">
        <h2>Other resources</h2>
        <ul>${[...other].map(([c, ss]) => `<li>${esc(c)} <span class="muted">· sessions ${ss.map((s) => s.number).join(", ")}</span></li>`).join("")}</ul>
      </section>`;
  }

  // ---------- Routing & events ----------
  let lastRoute = "";
  function render() {
    const h = location.hash || "#/";
    const route = h.split("/")[1] || "";
    for (const a of document.querySelectorAll(".tabs a")) {
      const target = a.getAttribute("href").split("/")[1] || "";
      a.toggleAttribute("aria-current", target === route || (route === "session" && target === ""));
      if (a.hasAttribute("aria-current")) a.setAttribute("aria-current", "page");
    }
    const m = h.match(/^#\/session\/(\d+)/);
    if (m) renderSession(+m[1]);
    else if (route === "coverage") renderCoverage();
    else if (route === "library") renderLibrary();
    else renderJourney();
    if (h !== lastRoute) window.scrollTo(0, 0);
    lastRoute = h;
  }

  window.addEventListener("hashchange", render);
  qInput.addEventListener("input", () => {
    state.q = qInput.value.trim().toLowerCase();
    if (/^#\/session/.test(location.hash)) location.hash = "#/";
    else render();
  });
  view.addEventListener("click", (e) => {
    const t = e.target.closest("[data-kind],[data-lens],[data-col],[data-ch]");
    if (!t) return;
    if (t.dataset.kind) state.kind = t.dataset.kind;
    else if (t.dataset.lens) { state.lens = t.dataset.lens; state.col = ""; }
    else if ("col" in t.dataset) {
      state.col = state.col === t.dataset.col ? "" : t.dataset.col;
      if (t.tagName === "A") { state.col = t.dataset.col; state.lens = "gtl"; return; }
    }
    else if (t.dataset.ch) state.ch = state.ch === +t.dataset.ch ? 0 : +t.dataset.ch;
    render();
  });
  view.addEventListener("change", (e) => {
    const act = e.target.dataset.act;
    if (act === "gtl") state.gtl = e.target.value;
    if (act === "sort") state.sort = e.target.value;
    if (act === "free") state.free = e.target.checked;
    render();
  });
  if (SKIN === "warm") {
    let w = 0, t;
    new ResizeObserver(() => {
      const nw = view.clientWidth;
      if (Math.abs(nw - w) < 8) return;
      w = nw;
      clearTimeout(t);
      t = setTimeout(() => { if (!/^#\/(session|coverage|library)/.test(location.hash)) render(); }, 80);
    }).observe(view);
  }
  render();
})();
