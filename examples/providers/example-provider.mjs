// Template of a provider module for a fictional agent CLI, "example-agent".
// No such tool exists: the flags below show what a real CLI would have to
// offer, and the tests drive this module with a stub instead of a process.
// Copy it as a starting point for a new provider, replace every flag with
// the real CLI's, check each declaration against that CLI, and keep the
// conformance fixtures next to it (see docs/providers.md).
//
// A profile registers it with:
//   import exampleProvider from './providers/example-provider.mjs';
//   export const PROFILE = { ..., providerModules: [exampleProvider],
//     implementer: { provider: 'example-agent', ... } };
import { defineProvider } from '../../scripts/providers/contract.mjs';

const EFFORTS = Object.freeze(['low', 'medium', 'high']);
const SESSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const MIN_VERSION = Object.freeze([1, 4, 0]);
const VERSION_LIMIT = Object.freeze([2, 0, 0]);
const SANDBOX_PLATFORMS = Object.freeze(['darwin', 'linux']);

// The single JSON object the fictional CLI prints with --json, or undefined.
function envelope(stdout) {
  try {
    const value = JSON.parse(stdout.trim());
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value
      : undefined;
  } catch {
    return undefined;
  }
}

// -1, 0 or 1 against a major.minor.patch triple; undefined for any other text.
function compareVersion(text, triple) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(text);
  if (!match) return undefined;
  for (let index = 0; index < 3; index += 1) {
    const part = Number(match[index + 1]);
    if (part !== triple[index]) return part > triple[index] ? 1 : -1;
  }
  return 0;
}

const enforced = (mechanism) => ({ status: 'enforced', mechanism });
const notSupported = (reason) => ({ status: 'not-supported', reason });

export default defineProvider({
  id: 'example-agent',
  program: 'example-agent',
  versionArgs: ['--version'],
  roles: ['implementer', 'reviewer'],
  efforts: EFFORTS,
  isValidModel: (value) => /^example-[a-z0-9.-]{1,40}$/.test(value),
  implementer: {
    modes: ['implementation', 'analysis'],
    stability: 'experimental',
    limitations: [
      'Template only: example-agent is a fictional CLI and every mechanism below is an assumption a real CLI must be checked against.',
    ],
    security: {
      noApprovalPrompts: enforced('--non-interactive: actions that would need approval are denied'),
      sandboxByMode: enforced(
        '--sandbox workspace (implementation) or --sandbox read-only (analysis); the CLI exits when the sandbox cannot start',
      ),
      noCommandNetwork: enforced('--network none for every command'),
      noUserConfiguration: enforced('--no-user-config'),
      pathGuards: enforced('processEnvironment puts the core guard directory first on PATH'),
      isolatedEnvironment: enforced("processEnvironment passes the core's environment unchanged apart from PATH"),
      schemaOutput: enforced('--output-schema <schema file> --json'),
      explicitResume: enforced('--resume <session ID> with the session of the previous result'),
      readOnlyTools: notSupported('The implementer writes in implementation mode.'),
    },
    processArgs({ taskMode, model, effort, schemaPath, sessionId }) {
      return [
        'run',
        '--non-interactive',
        '--sandbox',
        taskMode === 'analysis' ? 'read-only' : 'workspace',
        '--network',
        'none',
        '--no-user-config',
        '--model',
        model,
        '--effort',
        effort,
        '--output-schema',
        schemaPath,
        '--json',
        ...(sessionId ? ['--resume', sessionId] : []),
      ];
    },
    processEnvironment({ environment, guardBin }) {
      return { ...environment, PATH: `${guardBin}:${environment.PATH}` };
    },
    sessionId(stdout) {
      const session = envelope(stdout)?.session;
      return typeof session === 'string' && SESSION_ID.test(session)
        ? session
        : undefined;
    },
    // Only a successful result object carries the round report.
    output(stdout) {
      const result = envelope(stdout);
      if (result?.type !== 'result' || result.ok !== true) return undefined;
      return result.output && typeof result.output === 'object'
        ? { value: result.output }
        : undefined;
    },
    preflight({ version, platform }) {
      const low = compareVersion(version, MIN_VERSION);
      if (low === undefined || low < 0 || compareVersion(version, VERSION_LIMIT) >= 0)
        return 'UNSUPPORTED_VERSION';
      if (!SANDBOX_PLATFORMS.includes(platform)) return 'UNSUPPORTED_PLATFORM';
      return undefined;
    },
  },
  reviewer: {
    modes: ['implementation', 'analysis'],
    stability: 'experimental',
    limitations: ['Template only: example-agent is a fictional CLI.'],
    security: {
      noApprovalPrompts: enforced('--non-interactive'),
      sandboxByMode: notSupported('The reviewer has no command tool.'),
      noCommandNetwork: notSupported('The reviewer has no command or web tool.'),
      noUserConfiguration: enforced('--no-user-config'),
      pathGuards: notSupported('The reviewer has no command tool; the core adds no guards.'),
      isolatedEnvironment: enforced("processEnvironment passes the core's allowlisted environment unchanged"),
      schemaOutput: enforced('--output-schema-json <review schema> --json'),
      explicitResume: notSupported('Every review is a new session (--no-session).'),
      readOnlyTools: enforced('--read-only: file reading tools only'),
    },
    processArgs({ model, effort, outputSchema }) {
      return [
        'review',
        '--non-interactive',
        '--read-only',
        '--no-session',
        '--no-user-config',
        '--model',
        model,
        '--effort',
        effort,
        '--output-schema-json',
        JSON.stringify(outputSchema),
        '--json',
      ];
    },
    processEnvironment({ environment }) {
      return { ...environment };
    },
    reviewOutput(result) {
      return result?.type === 'review' &&
        result.ok === true &&
        result.review &&
        typeof result.review === 'object'
        ? { value: result.review }
        : undefined;
    },
    // No failure of this CLI allows a fallback to the second review model.
    fallbackReason() {
      return undefined;
    },
  },
});

// Fixtures for the conformance suite (scripts/providers/conformance.mjs):
// the output format of the fictional CLI and the hosts its preflight
// accepts and refuses.
export const conformanceFixtures = Object.freeze({
  model: 'example-large-1',
  implementer: {
    stdout: (report, session) =>
      JSON.stringify({ type: 'result', ok: true, session, output: report }),
    withoutSession: [
      JSON.stringify({ type: 'result', ok: true, output: {} }),
      JSON.stringify({ type: 'result', ok: true, session: 'not-a-uuid', output: {} }),
    ],
    malformed: [
      JSON.stringify({ type: 'result', ok: false, output: { status: 'COMPLETED' } }),
      JSON.stringify({ type: 'progress', ok: true, output: { status: 'COMPLETED' } }),
      JSON.stringify({ type: 'result', ok: true, output: 'COMPLETED' }),
      JSON.stringify([{ type: 'result', ok: true, output: {} }]),
    ],
  },
  reviewer: {
    envelope: (review) => ({ type: 'review', ok: true, review }),
    malformed: [
      { type: 'review', ok: false, review: { verdict: 'APPROVE' } },
      { type: 'result', ok: true, review: { verdict: 'APPROVE' } },
      { type: 'review', ok: true, review: 'APPROVE' },
      {},
    ],
  },
  preflight: {
    accepted: [
      { version: '1.4.0', platform: 'linux' },
      { version: '1.9.12', platform: 'darwin' },
    ],
    refused: [
      { version: '1.3.9', platform: 'linux', reason: 'UNSUPPORTED_VERSION' },
      { version: '2.0.0', platform: 'linux', reason: 'UNSUPPORTED_VERSION' },
      { version: '1.4.0-beta.1', platform: 'linux', reason: 'UNSUPPORTED_VERSION' },
      { version: '1.4.0', platform: 'win32', reason: 'UNSUPPORTED_PLATFORM' },
    ],
  },
});
