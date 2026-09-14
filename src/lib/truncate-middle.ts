// Middle truncation for the three strings a session row shows that carry their
// meaning at BOTH ends — branches, pull requests and paths.
//
// End truncation is the wrong tool for all three, and the handoff's opening
// diagnosis is a row that proves it: `Persistent blo…-windows-acl`. Everything
// that identifies that branch — the `fix/` class at the front, the
// `windows-acl` subject at the back — survives only by accident, and the 15
// rows beside it truncate to the same prefix. A title can end-truncate safely
// because its information is front-loaded; a branch cannot.
//
// Each rule keeps the two ends that answer a different question:
//   branch  — what KIND of work (`fix/`) and what it is ABOUT (`windows-acl`)
//   PR      — the number and the state, which are what you act on
//   path    — the host and the leaf, which are what you recognise
//
// All three are pure string functions so they pin in tests without a DOM, and
// all three are no-ops when the input already fits: truncation never lengthens
// a string, and a row that fits must render whole.

/** Visible-character floor the handoff sets for a truncated branch (§3). */
export const MIN_BRANCH_VISIBLE = 22;

const HEAD_CHARS = 6;
const TAIL_CHARS = 12;
const ELLIPSIS = "…";

/** Separators that must not be left stranded against the ellipsis. */
const EDGE_SEPARATORS = /^[-_/.]+|[-_/.]+$/g;

/**
 * `fix/cave-9jt60-revert-windows-acl` → `fix/cave-9…windows-acl`
 *
 * Keeps the first path segment whole (it is the branch's class — `fix`,
 * `feat`, `docs` — and it is short by convention), then the first 6 and last
 * 12 characters of what remains. A separator orphaned against the ellipsis is
 * trimmed, which is what makes the result read as `…windows-acl` rather than
 * `…-windows-acl`.
 *
 * A branch with no `/` keeps the same head/tail budget without the segment.
 */
export function truncateBranch(branch: string): string {
  const value = (branch ?? "").trim();
  if (!value) return "";

  const slash = value.indexOf("/");
  const prefix = slash > 0 ? value.slice(0, slash + 1) : "";
  const rest = slash > 0 ? value.slice(slash + 1) : value;

  if (rest.length <= HEAD_CHARS + TAIL_CHARS) return value;

  const head = rest.slice(0, HEAD_CHARS).replace(EDGE_SEPARATORS, "");
  const tail = rest.slice(-TAIL_CHARS).replace(EDGE_SEPARATORS, "");
  const truncated = `${prefix}${head}${ELLIPSIS}${tail}`;

  // Truncation that does not shorten is just a lie with an ellipsis in it.
  return truncated.length < value.length ? truncated : value;
}

/**
 * `PR #5385 · merged` — the number and the state are never truncated, and the
 * PR's title is dropped BEFORE either of them. A truncated number is not a
 * shorter fact, it is a different PR.
 */
export function formatPullRequest(pr: {
  number: number;
  state?: string | null;
  title?: string | null;
}, options: { maxLength?: number } = {}): string {
  const stem = `PR #${pr.number}`;
  const state = (pr.state ?? "").trim().toLowerCase();
  const base = state ? `${stem} · ${state}` : stem;
  const title = (pr.title ?? "").trim();
  if (!title) return base;

  const full = `${base} · ${title}`;
  const max = options.maxLength ?? 0;
  // No budget, or it fits: keep the title. Otherwise the title is what goes.
  if (!max || full.length <= max) return full;
  return base;
}

/**
 * `https://github.com/OpenCoven/sdk/issues/41` → `github.com/…/sdk/issues/41`
 *
 * Host and final segments are what a person recognises; the middle of a URL is
 * the part they never read. The scheme is always dropped — it identifies
 * nothing on a row — and `www.` with it.
 */
export function truncatePath(input: string, options: { tailSegments?: number } = {}): string {
  const value = (input ?? "").trim();
  if (!value) return "";
  const tailSegments = Math.max(1, options.tailSegments ?? 3);

  const withoutScheme = value.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "").replace(/^www\./i, "");
  const [pathPart] = withoutScheme.split(/[?#]/, 1);
  const segments = pathPart.split("/").filter(Boolean);
  if (segments.length <= tailSegments + 1) return withoutScheme;

  const host = segments[0];
  const tail = segments.slice(-tailSegments).join("/");
  return `${host}/${ELLIPSIS}/${tail}`;
}
