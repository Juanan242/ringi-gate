# Good first issues

Small, self-contained tasks for a first contribution. Each one was checked
against the code when this list was written. Line numbers drift, so search for
the function or test name instead. Comment on the issue before you start, so
two people don't pick the same one. General rules are in
[CONTRIBUTING.md](../CONTRIBUTING.md).

Items marked **Needs a decision before code** need a quick agreement in the
issue first.

## 1. Count re-exports in the prompts "no imports" test

The prompts module is supposed to have no imports. Its surface test, `runner surface contract: prompts named exports and no imports` in `scripts/agent-review-loop.test.mjs`, walks the syntax tree with its own `visit` function and counts `import` declarations and dynamic `import()`. It misses re-exports like `export { x } from './y.mjs'` or `export * from './y.mjs'`, which load a module too.

The providers test already catches them: `moduleImportSpecifiers` in the same file also collects export declarations that have a module specifier. Use it in the prompts test as well (the expected list is empty) instead of a second visitor. `npm test` should pass.

## 2. Reject U+1E9E in docs candidate paths

Docs-only changes reject paths with a non-ASCII character whose case mapping contains an ASCII letter, since a case-insensitive file system could fold it into an excluded name ([profile.md](profile.md#docscandidatepolicy)).

`hasAsciiFoldingCharacter` checks `toUpperCase()` and `toLowerCase()` of each character, and U+1E9E (capital sharp s) gets through: it lowercases to U+00DF, which has no ASCII letter, but `'ß'.toUpperCase()` is `SS`.

Fix: also check `toLowerCase().toUpperCase()` (and `toUpperCase().toLowerCase()` if it helps). Add a test where a docs candidate path with U+1E9E is rejected with `DOCS_CANDIDATE_REJECTED`, and one showing that ordinary non-ASCII names, such as Polish file names, still pass. Update the examples in `docs/profile.md` if they change.

Files: `scripts/agent-review-loop-lib.mjs`, `scripts/agent-review-loop.test.mjs`.

## 3. Align the CLI fallback report with the documentation (decision first)

**Needs a decision before code.**

If an error that isn't an `AgentWorkflowError` reaches the CLI, the `catch` block in `scripts/agent-review-loop.mjs` writes its own report (`status: 'STOPPED'`, `code: 'UNEXPECTED_ERROR'`) with no `publicationApproved` field and exits with code `2`. `ringi run` does the same in `runCommand` in `scripts/ringi-cli.mjs`, and its report for a stop before the run (`stopBeforeRun`) has no `publicationApproved` field either.

That doesn't match the docs. The README says run reports carry `publicationApproved: false`, and [architecture.md](architecture.md#report) gives exit code `1` for any stopped run (`UNEXPECTED_ERROR` included) and `2` for errors outside the runner. This fallback is a bit of both. Errors inside the runner are fine: the core already turns them into `UNEXPECTED_ERROR` reports with `publicationApproved: false`.

The test `schemaVersion: CLI fallback preserves JSON and exit codes` pins the current shape and exit code on purpose, so it has to change together with whichever side gets fixed.

Agree on one option in the issue first: either the fallback report gains `publicationApproved: false` (and the pinned test follows), or the docs describe this report and its exit code as they are. Files: `scripts/agent-review-loop.mjs`, `scripts/ringi-cli.mjs`, `docs/architecture.md`, `docs/cli.md`, `README.md`, `scripts/agent-review-loop.test.mjs`, `scripts/ringi-cli.test.mjs`.

## 4. Keep the baseline compatibility tests from fetching objects lazily (obsolete)

Does not apply: the compatibility tests do not read older commits with `git show`. They compare the runner with golden snapshots in `scripts/fixtures/golden/` and need no Git history (see [testing.md](testing.md#golden-snapshots)).

## 5. Safe error message for an invalid review profile name

`resolveReviewProfile` puts `JSON.stringify(profile)` into its error message. For a `BigInt` or a cyclic object that call throws a `TypeError` first, so instead of `INVALID_REVIEW_PROFILE` you get `UNEXPECTED_ERROR`.

The CLI only passes strings, but the `reviewProfile` option of `runAgentReviewLoop` accepts anything, and [profile.md](profile.md#reviewer) promises `INVALID_REVIEW_PROFILE` for any non-string.

Describe non-string values safely (their type is enough) and add tests for a `BigInt` and a cyclic object that expect `INVALID_REVIEW_PROFILE` at stage `preflight`. Files: `scripts/agent-review-loop-lib.mjs`, `scripts/agent-review-loop.test.mjs`.

## 6. `--review-profile` without a value

If `--review-profile` is the last argument, `parseAgentArguments` reads `undefined` as its value. `Object.hasOwn(profiles, undefined)` then looks up the key `"undefined"`, so a profile with a review profile literally named `undefined` (a valid name right now) would accept the flag with no value.

Make a missing value an argument error for every option that takes one, for example with `typeof value === 'string'`. Check `--task-mode`, `--codex-model` and `--sol-effort` for the same pattern. Add a test with a review profile named `undefined`.

Files: `scripts/agent-review-dashboard.mjs`, `scripts/agent-review-loop.test.mjs`.

## 7. Headings inside fenced code blocks in task files (decision first)

**Needs a decision before code.**

The task parser finds sections with a regex over the whole file, so `## Scope` inside a fenced code block (backticks or tildes) starts a new section. The analysis artifact check already skips fenced code (`markdownHeadings` in the core), which is a good model.

Two options: skip fenced blocks, or reject tasks whose fences contain known section headings. Pick one in the issue first. After that: update `parseMarkdownSections` in `scripts/agent-review-loop-lib.mjs`, cover backtick and tilde fences in tests, and describe the rule in the [Task file](architecture.md#task-file) section. Both `npm test` and `node --test examples/validate-examples.test.mjs` should pass.

## 8. Document which section names the prompts quote (done)

Done: with `locale: 'en'` (the default) the writer and reviewer prompts are in English and quote the English canonical section names (`"Required checks"` and so on); with `locale: 'pl'` they are the original Polish prompts with the Polish names. The [Task file](architecture.md#task-file) section of `docs/architecture.md` describes it, and [docs/profile.md](profile.md#locale) lists what the locale selects.

## 9. English argument errors in the CLI parser (done)

Done: runner messages, including the argument errors from `parseAgentArguments`, are English by default, and a profile can set `locale: 'pl'` for Polish (see [docs/profile.md](profile.md)).

## 10. More checks for the example profile

[examples/validate-examples.test.mjs](../examples/validate-examples.test.mjs) checks the example profile and task against the core. More cases would help, for example:

- the effective checks of the example profile's `docs-contract` class (a docs class with review, using the `docs` check set); today the test checks only that it requires review;
- the `handbook/` docs rule from [profile.md](profile.md#docscandidatepolicy);
- a `requiredGateRules` entry without `message`.

Add at least one test that runs against the core without starting agents and update `examples/README.md` if the list of checks changes. `node --test examples/validate-examples.test.mjs` should pass.
