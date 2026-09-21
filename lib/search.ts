import { signal } from "@preact/signals";
import { IS_BROWSER } from "fresh/runtime";

// Shared by the header search box and whichever list island is on the page. Islands read
// `initialQ` (from the URL) on the server instead, so no request state lives in this module.
export const query = signal(IS_BROWSER ? new URL(location.href).searchParams.get("q") ?? "" : "");

export const currentQuery = (initialQ: string) => IS_BROWSER ? query.value : initialQ;

export const matchesQuery = (text: string, q: string) =>
  !q || q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => text.includes(w));
