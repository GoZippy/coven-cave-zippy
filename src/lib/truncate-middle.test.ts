import assert from "node:assert/strict";
import {
  MIN_BRANCH_VISIBLE,
  formatPullRequest,
  truncateBranch,
  truncatePath,
} from "./truncate-middle.ts";

// ── Branch ────────────────────────────────────────────────────────────────────
// The handoff's own worked example (spec §3), which is also the branch its
// opening diagnosis shows end-truncated into uselessness.
assert.equal(
  truncateBranch("fix/cave-9jt60-revert-windows-acl"),
  "fix/cave-9…windows-acl",
  "keeps the class prefix and the subject; drops the middle",
);
assert.equal(
  truncateBranch("fix/cave-9jt60-revert-windows-acl").length,
  MIN_BRANCH_VISIBLE,
  "the spec's 22-visible-character floor is exactly met",
);
assert.ok(
  !truncateBranch("fix/cave-9jt60-revert-windows-acl").includes("…-"),
  "a separator is never left stranded against the ellipsis",
);

// Short branches are returned whole — truncation must never lengthen.
for (const branch of ["main", "fix/a", "feat/short-one", ""]) {
  assert.equal(truncateBranch(branch), branch, `short branch untouched: ${branch || "(empty)"}`);
}
assert.equal(truncateBranch("  main  "), "main", "trims surrounding whitespace");

// No slash: same head/tail budget, no phantom prefix.
assert.equal(truncateBranch("cave-9jt60-revert-windows-acl"), "cave-9…windows-acl");

// Two branches sharing a long prefix stay distinguishable — the failure mode
// that end truncation produces and this function exists to prevent.
const a = truncateBranch("fix/cave-9jt60-revert-windows-acl");
const b = truncateBranch("fix/cave-9jt60-revert-darwin-boot");
assert.notEqual(a, b, "same-prefix branches do not collapse to one string");

// ── Pull request ──────────────────────────────────────────────────────────────
assert.equal(formatPullRequest({ number: 5385, state: "merged" }), "PR #5385 · merged");
assert.equal(formatPullRequest({ number: 41 }), "PR #41", "state is optional");
assert.equal(
  formatPullRequest({ number: 41, state: "OPEN" }),
  "PR #41 · open",
  "state is normalised to sentence case input-insensitively",
);
assert.equal(
  formatPullRequest(
    { number: 5385, state: "merged", title: "Unblock the Windows release leg" },
    { maxLength: 20 },
  ),
  "PR #5385 · merged",
  "the title is dropped before the number or the state ever is",
);
assert.equal(
  formatPullRequest({ number: 5385, state: "merged", title: "Short" }, { maxLength: 200 }),
  "PR #5385 · merged · Short",
  "the title survives when it fits",
);

// ── Path / URL ────────────────────────────────────────────────────────────────
assert.equal(
  truncatePath("https://github.com/OpenCoven/sdk/issues/41"),
  "github.com/…/sdk/issues/41",
  "host and leaf survive; the middle goes",
);
assert.equal(truncatePath("github.com/OpenCoven/sdk"), "github.com/OpenCoven/sdk", "short paths untouched");
assert.equal(truncatePath("https://www.github.com/a/b/c/d/e"), "github.com/…/c/d/e", "www. is dropped with the scheme");
assert.equal(truncatePath(""), "");

console.log("truncate-middle.test.ts: ok");
