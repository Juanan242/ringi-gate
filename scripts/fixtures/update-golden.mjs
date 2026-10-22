#!/usr/bin/env node
// Manual update of the compatibility test snapshots (scripts/fixtures/golden/).
//
//   node scripts/fixtures/update-golden.mjs [snapshot-name ...]
//
// Runs the [golden] tests from scripts/agent-review-loop.test.mjs. A test
// that does not match its snapshot, or has none, writes a snapshot candidate
// to os.tmpdir() and prints the diagnostic "golden-candidate <name> <file>";
// the script copies those candidates (or only the named ones) to
// scripts/fixtures/golden/. The tests themselves never write snapshots
// to the repository. A snapshot change is a behaviour change: check git diff
// and describe it in the review.
import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const fixtures = dirname(fileURLToPath(import.meta.url));
const scripts = dirname(fixtures);
const golden = join(fixtures, 'golden');
const names = process.argv.slice(2);

if (names.some((name) => !/^[a-z0-9][a-z0-9-]*$/u.test(name))) {
  process.stderr.write(
    'Usage: node scripts/fixtures/update-golden.mjs [snapshot-name ...]\n',
  );
  process.exit(2);
}

const runGolden = () => {
  const run = spawnSync(
    process.execPath,
    [
      '--test',
      '--test-reporter=tap',
      '--test-name-pattern=\\[golden\\]',
      join(scripts, 'agent-review-loop.test.mjs'),
    ],
    { cwd: dirname(scripts), encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 },
  );
  if (run.error) throw run.error;
  return run;
};
const child = runGolden();

const candidates = new Map();
for (const [, name, file] of child.stdout.matchAll(
  /^\s*# golden-candidate ([a-z0-9-]+) (.+)$/gmu,
)) {
  candidates.set(name, file.trim());
}
for (const name of names) {
  if (!candidates.has(name))
    process.stdout.write(`${name}: no candidate (snapshot is current or the test did not finish)\n`);
}

let updated = 0;
for (const [name, file] of candidates) {
  if (names.length > 0 && !names.includes(name)) continue;
  const content = await readFile(file, 'utf8');
  const snapshot = JSON.parse(content);
  if (snapshot.format !== 1 || typeof snapshot.entries !== 'object')
    throw new Error(`${file} is not a golden snapshot candidate.`);
  await writeFile(join(golden, `${name}.json`), content);
  process.stdout.write(`updated scripts/fixtures/golden/${name}.json\n`);
  updated += 1;
}

// Requested snapshots without a candidate are an error when the run failed.
const missing = names.filter((name) => !candidates.has(name));
process.stdout.write(
  updated > 0
    ? `${updated} snapshot(s) updated. Review git diff scripts/fixtures/golden/ and run npm test.\n`
    : 'No snapshot updated.\n',
);
// Failures other than snapshot differences stay visible. The verdict uses the
// exit code of the test process, not the reporter output: after copying the
// candidates the [golden] tests run again and must pass.
let failing = child.status !== 0 && (updated === 0 || missing.length > 0);
if (child.status !== 0 && !failing) failing = runGolden().status !== 0;
if (failing) {
  process.stdout.write(
    `[golden] tests still fail after ${updated} snapshot update(s): failures without a candidate or snapshots not requested. Rerun after fixing them.\n`,
  );
  process.exitCode = 1;
}
