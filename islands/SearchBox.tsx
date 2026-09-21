import { currentQuery, query } from "../lib/search.ts";

const LIVE_PAGES = ["/", "/coverage", "/library"];

/** Filters the current list page as you type; elsewhere, Enter searches the journey. */
export default function SearchBox({ path, initialQ }: { path: string; initialQ: string }) {
  const live = LIVE_PAGES.includes(path);
  return (
    <form class="search" action={live ? path : "/"} method="get" role="search">
      <label>
        <span class="vh">Search the curriculum</span>
        <input
          id="q"
          name="q"
          type="search"
          placeholder="Search topics, objectives, articles"
          autocomplete="off"
          value={currentQuery(initialQ)}
          onInput={(e) => {
            query.value = e.currentTarget.value;
            if (!live) return;
            const url = new URL(location.href);
            if (query.value) url.searchParams.set("q", query.value);
            else url.searchParams.delete("q");
            history.replaceState(null, "", url);
          }}
          onKeyDown={(e) => {
            if (live && e.key === "Enter") e.preventDefault();
          }}
        />
      </label>
    </form>
  );
}
