---
name: Bug report
about: The runner behaves differently from its documentation or tests
title: 'Bug: '
labels: bug
---

<!--
Security issues: do not report them here. See SECURITY.md.
Use synthetic data only. Remove secrets, private paths, personal data and
real project names from logs and reports before pasting them.
-->

## What happened

<!-- One or two sentences. -->

## What you expected

<!-- Link the part of README.md or docs/ that describes the expected
behaviour, if there is one. -->

## Steps to reproduce

<!-- The smallest synthetic profile and task that show the problem are the
most helpful. -->

1.
2.

## Report

<!-- From report.json, the dry-run JSON or the stderr diagnostic, e.g.
STOPPED / CHECK_FAILED / checks. -->

- Status:
- Code:
- Stage:
- Command and options (e.g. `--dry-run`, `--task-mode analysis`):

## Where it happens

- [ ] Profile validation (`INVALID_CONFIGURATION`)
- [ ] Task parsing
- [ ] Preflight (Git, pnpm, Corepack, agent CLIs)
- [ ] Writer round or guards
- [ ] Gates
- [ ] Snapshot or review
- [ ] Report, exit code or dashboard
- [ ] Not sure

## Environment

- Commit:
- Node.js version:
- Operating system:
- pnpm / Corepack version (if relevant):
- Codex CLI / Claude Code CLI version (if relevant):
