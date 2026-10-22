# Task quality classes

This policy defines the task classes of this repository's default profile (`scripts/agent-review-profile.mjs`), and those classes point to it. The coordinator picks the class from the accepted risk and writes one class name in the optional `Task class` section (Polish: `Klasa zadania`). A task without the section gets `implementation`, the full run. An empty, unknown or repeated section is refused. The runner does not guess the risk from file extensions or from words in the document.

| Class              | Scope                                                         | Gates                              | Independent review |
| ------------------ | ------------------------------------------------------------- | ---------------------------------- | ------------------ |
| `docs-minor`       | typos, links, statuses without a change of rules or meaning   | `docs` check set                   | `NOT_REQUIRED`     |
| `docs-descriptive` | description of existing behaviour, checked by the writer against the source | `docs` check set     | `NOT_REQUIRED`     |
| `docs-contract`    | data model, permissions, process or a new contract            | `docs` check set                   | required           |
| `implementation`   | implementation; also the default without an explicit class    | `base` check set                   | required           |
| `critical`         | auth, migrations, security, deployment or runner policy       | `base` check set, as `implementation` | required        |

In this repository's profile the `docs` check set is `git diff --check`, and the `base` set is `pnpm check` and `git diff --check`.

Checks that a task requests explicitly always run as well, also `pnpm check` written by a person into a docs task. No class adds a gate beyond its check set. A change that needs a specific gate, such as integration tests, must request it in the accepted task; a profile can require it for given paths with `requiredGateRules` (this repository's profile declares none). A change to the runner itself is `critical`.

`analysis` is a separate read-only track with a mandatory review of the analysis and the integrity checks, without command gates. No class, or an explicit `implementation`, keeps that contract; any other explicit class in `analysis` is refused. The class does not change the model or effort of the writer or the reviewer. The default review profile, `critical`, is `claude-fable-5` at `high` effort with a controlled fallback (see [profile.md](../profile.md#reviewer)).

## Docs path boundary

All three docs classes check the whole real candidate against HEAD in preflight, after the writer and after the gates. The check covers earlier changes, untracked files, deletions and both ends of a rename. Only regular, non-executable `.md` files under `docs/` or exactly `README.md` are allowed. Deleting an ordinary document may pass, but deleting code or instructions, or a rename that crosses the boundary, is refused. The type check in HEAD also covers deleted files and a symbolic link replaced by a regular file. Symbolic links, also in parent directories, other file types and paths that escape the repository are refused.

`AGENTS.md`, `CLAUDE.md`, `SECURITY.md`, `SKILL.md`, the directories `skills`, `.agents`, `.claude` and `.codex`, and the project's agent procedures `docs/development/agent-*` and `docs/development/frontend-agent-skills.md` are outside the docs track. New instructions, skills and procedures that agents execute or interpret also need the full track; the coordinator must not classify them as docs only because they are Markdown files.

Automation cannot reliably recognise a security-relevant change of meaning in a document. The coordinator sets the class from the accepted risk; when in doubt, the default full track applies. The path check does not prove that the content is safe. Secret scanners, the checks of Git, of dependency inputs and metadata, of scope, and of integrity and isolation apply in every class.

## Acceptance and corrections

Group related documents into one accepted task and one acceptance. The writer checks the documentation against the sources and gives the evidence in its report. Docs corrections run the same docs gates and the checks the task requests explicitly; they add no application tests and no full gate run. In `docs-contract` the reviewer confirms corrections findings-first. Every round runs the gates again on the current tree; a PASS is never cached between changed trees.

`docs-minor` and `docs-descriptive` get no independent review. The runner does not call Claude, not even to read its version, and does not need it to be available. The review part of the report has `NOT_REQUIRED`, the reason, a reference to this policy, zero attempts and the remaining assurance limits. It has no made-up verdict, no effective model and no zero findings that would suggest a review took place. The dry-run plan and the dashboard show the class, the effective gates and the review state. The dashboard's linear feed shows `—` for the missing review profile and keeps `NOT_REQUIRED` and zero attempts. `APPROVE` means that the required control path finished.

Before publication a separate checkpoint of the whole scope is still needed, with the checks and review that fit the combined risk. The rules for staging, commits, pushes, pull requests and merges do not change; a runner result is not an approval to publish.
