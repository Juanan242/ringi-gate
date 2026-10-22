# Roadmap

Goal: a public repository of Ringi Gate that, after `npm install` and one
command, gives a working fail-closed agent pipeline on someone else's
project, with a README that shows what the code does today rather than what
is planned.

Everything below "Planned" is a plan, not a feature. The
[README](README.md) and [docs/](docs/) describe only what is implemented.

## Done

- Standalone core. `package.json` (Node.js 24 or newer, no runtime
  dependencies beyond Node.js built-ins, `typescript` as a development
  dependency only), a default project profile at the binding point
  (`scripts/agent-review-profile.mjs`), core tests that run on their own.
- Gate registry as profile configuration. `checks`, `checkSets` and
  `requiredGateRules` in the project profile, with fail-closed validation.
- Argv shape allowlist for gates. Allowed argv shapes for pnpm and git gate
  checks; pnpm checks always executed as
  `pnpm [--filter <package>] run <script>`; rule codes with the `_GATE`
  suffix.
- Task schema in the profile. `taskSchema` with required and optional
  sections, aliases and `taskSchemaVersion` in the report. Prompt texts moved out of the core into
  `scripts/agent-review-prompts.mjs`; profiles cannot change them.
- Task quality classes in the profile. `taskClasses` and
  `docsCandidatePolicy` in the profile, with core invariants (review may be
  skipped only for documentation-only classes).
- Neutral roles and provider adapters. Roles `implementer` and `reviewer` in
  the profile and the report; adapters for the Codex CLI (implementer) and
  the Claude Code CLI (reviewer) in a closed core registry
  (`scripts/agent-review-providers.mjs`).
- The Claude Code CLI as an implementer (experimental). A profile may select
  `implementer.provider: 'claude'`: print mode without approval prompts,
  read-only tools in analysis, Bash only inside the CLI's offline sandbox, no
  user configuration, schema-checked output and explicit session resume,
  accepted CLI versions checked in preflight; the core fingerprints the Git
  directory around every round (see
  [docs/architecture.md](docs/architecture.md#claude-code-as-implementer)).
  The default implementer stays `codex`.
- An open provider interface. A provider contract
  (`scripts/providers/contract.mjs`): roles with task modes, command and
  environment building, result and session reading, host preflight, and a
  security declaration (`enforced` with its mechanism, or `not-supported`)
  for each safety guarantee, with `stable`/`experimental` stability and
  known limits. Role rules in the core refuse an `implementer` whose
  declaration does not mark the sandbox, network blocking, prompt-free
  operation and the other writer guarantees as `enforced`, or that has no
  preflight, and a `reviewer` that does not declare read-only tools. The
  declaration is the module's self-report: the core does not verify that a
  CLI keeps its sandbox, network blocking or approval settings, and its
  scan of the argv is a list of known bypass patterns, not a guarantee;
  review of the module is the guarantee. Independently of the declaration
  the core enforces the isolated environment, the guards, the Git directory
  fingerprint and private index for modules from a profile, the session
  rule, model and task mode checks, and argv taken as a frozen copy.
  `codex` and `claude` moved to modules on this contract without a change
  of behaviour. A profile can pass further modules in `providerModules`
  (objects, never paths); the core validates them and keeps its own checks.
  A conformance suite checks any module without a CLI or model; a template
  provider for a fictional CLI is in `examples/providers/`. No adapter for
  another real CLI is included. See [docs/providers.md](docs/providers.md).
- `ringi init`, `ringi doctor`, `ringi run`. One command (`bin/ringi.mjs`,
  run with Node.js from a checkout; no npm package yet) for any Git
  repository: `init` writes `ringi.config.mjs` (gates inferred from
  `package.json`) and an English task template and never overwrites a file;
  `doctor` runs read-only checks with the runner's own preflight functions;
  `run` is the runner with the profile from `ringi.config.mjs` at the
  repository root. The profile is loaded once with a SHA-256 fingerprint of
  it and its local imports; a change during the run stops it with
  `PROFILE_MODIFIED`. `node scripts/agent-review-loop.mjs` works as before.
  See [docs/cli.md](docs/cli.md).
- Runner messages in English, with Polish as a localization. Every runner
  message for a person comes from a message catalog (`scripts/messages/`),
  English by default, Polish with `locale: 'pl'` in the profile. With
  `'pl'` full runs, the terminal output and the CLI parser are identical to
  the runner before the catalog (a test compares them with the code of that
  version). Stop codes, report fields and prompts are unchanged.
- English agent prompts and task headings. The profile's `locale` also
  selects the writer and reviewer prompts and the default task schema:
  `'en'` (default) prompts are neutral about providers, models and projects
  and quote English section names; the default schema has English canonical
  names with Polish aliases. With `'pl'` prompts and schema are the previous
  ones, byte for byte. Stop codes, report fields and agent result schemas
  are unchanged.
- Name and license. The project is Ringi Gate (package name `ringi-gate`,
  the command stays `ringi`), licensed under the Apache License 2.0
  (`LICENSE`, `NOTICE`).

## Planned (not implemented)

- Remaining hardening of the core; small items are listed in
  [docs/good-first-issues.md](docs/good-first-issues.md).
- Entry point, branding and a presentation boundary (the terminal dashboard
  as one of several presenters).
- Provider modules for other agent CLIs, each with a checked security
  declaration and conformance fixtures from the real CLI, on the open
  provider interface.
- Prompts as configuration (today a profile only chooses their locale).
- A CI adapter (GitHub Actions first), a CI budget policy and CI evidence.
- Tests split into a generic part and synthetic example repositories
  (Node.js/pnpm first).
- Documentation of the configuration contract, the task format, the report
  format (`schemaVersion`), the stop codes and the threat model.
- Release 0.1.0: a new public repository with a clean initial commit and npm
  publication with provenance.
- Before any public release: publication security checklist.
