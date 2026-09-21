"""Assemble the three mockup HTML files from app.js + base.css + one skin + data/curriculum.json."""

import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = json.loads((HERE.parent / "data" / "curriculum.json").read_text())

SKINS = {
    "editorial": ("Didactic Atlas", "Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500"),
    "app": ("Curriculum Console", "Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700"),
    "keynote": ("Curriculum Keynote", "Newsreader:ital,opsz,wght@1,6..72,400&family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400"),
    "pro": ("Curriculum Pro", "Newsreader:ital,opsz,wght@1,6..72,400&family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400"),
    "newsroom": ("Curriculum Newsroom", "Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400"),
    "warm": ("Pelvic Floor Trail", "Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Atkinson+Hyperlegible:wght@400;700&family=Atkinson+Hyperlegible+Mono:wght@400;700"),
}

base = (HERE / "base.css").read_text()
app_js = (HERE / "app.js").read_text()
blob = json.dumps(DATA, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")

for skin, (title, fonts) in SKINS.items():
    css = base + "\n" + (HERE / f"skin-{skin}.css").read_text()
    html = f"""<title>{title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family={fonts}&display=swap">
<style>
{css}
</style>
<div class="app" data-skin="{skin}">
  <header class="top">
    <a class="brand" href="#/"><span class="brand-kicker">URPS Fellowship</span><span class="brand-name">Curriculum</span></a>
    <nav class="tabs" aria-label="Sections">
      <a href="#/">Journey</a><a href="#/coverage">Coverage</a><a href="#/library">Library</a>
    </nav>
    <label class="search"><span class="vh">Search the curriculum</span>
      <input id="q" type="search" placeholder="Search topics, objectives, articles" autocomplete="off"></label>
  </header>
  <main id="view"></main>
  <footer class="foot">Aligned to the AUGS Guide to Learning (2024), the URPS Qualifying Exam Blueprint, and Walters &amp; Karam, 5th edition.
    Design mockup: {title}.</footer>
</div>
<script type="application/json" id="data">{blob}</script>
<script>
{app_js}
</script>
"""
    out = HERE / f"{skin}.html"
    out.write_text(html)
    print(f"{out.name}: {len(html):,} bytes")
