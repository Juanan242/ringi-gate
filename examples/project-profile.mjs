// Synthetic project profile for an imaginary pnpm monorepo with a web app
// and an API package. It has the same shape as scripts/agent-review-profile.mjs
// (the module the CLI imports) and can replace that file's contents.
// The runner validates it with the same fail-closed rules as the default
// profile; examples/validate-examples.test.mjs checks that it is accepted.
export const PROFILE = {
  title: 'EXAMPLE WORKFLOW',
  tempPrefix: 'example-review-',
  checks: {
    'pnpm lint': {
      program: 'pnpm',
      args: ['lint'],
      timeoutMs: 10 * 60_000,
    },
    'pnpm test': {
      program: 'pnpm',
      args: ['test'],
      timeoutMs: 15 * 60_000,
    },
    'pnpm docs:check': {
      program: 'pnpm',
      args: ['docs:check'],
      timeoutMs: 5 * 60_000,
    },
    'pnpm --filter @example/api run test:integration': {
      program: 'pnpm',
      args: ['--filter', '@example/api', 'run', 'test:integration'],
      timeoutMs: 30 * 60_000,
      // Exact pnpm argv the implementer's pnpm guard also allows while this check
      // is part of the task.
      nestedInvocations: [['--filter', '@example/api', 'run', 'db:reset']],
      passDockerHost: true,
    },
    'git diff --check': {
      program: 'git',
      args: ['diff', '--check'],
      timeoutMs: 2 * 60_000,
    },
  },
  checkSets: {
    base: ['pnpm lint', 'git diff --check'],
    docs: ['pnpm docs:check', 'git diff --check'],
  },
  requiredGateRules: [
    {
      check: 'pnpm --filter @example/api run test:integration',
      prefixes: ['packages/api/src/db/'],
      paths: ['packages/api/schema.sql'],
      code: 'API_INTEGRATION_GATE',
      message:
        'Database changes in packages/api require the API integration check.',
    },
  ],
  // Optional task classes; without this field the core default classes
  // apply. A class may skip independent review only with docsOnly: true,
  // and implementation (used when a task names no class) is the full track.
  taskClasses: {
    implementation: {
      independentReviewRequired: true,
      checkSet: 'base',
      docsOnly: false,
      reason: 'Code changes require independent review.',
      remainingAssurance: 'Human checkpoint before publication.',
    },
    'docs-typo': {
      independentReviewRequired: false,
      checkSet: 'docs',
      docsOnly: true,
      reason: 'Approved policy for typo and link fixes in documentation.',
      remainingAssurance:
        'No independent review; the writer checks sources, human checkpoint before publication.',
      policy: 'docs/task-classes.md',
    },
    'docs-contract': {
      independentReviewRequired: true,
      checkSet: 'docs',
      docsOnly: true,
      reason: 'Documentation contracts require independent review.',
      remainingAssurance: 'Human checkpoint before publication.',
      policy: 'docs/task-classes.md',
    },
  },
  // Optional rule for the candidate of docsOnly classes; without this field
  // the core default applies. The base exclusions (AGENTS.md, CLAUDE.md,
  // .git, .agents, .claude, .codex, skills) must stay listed.
  docsCandidatePolicy: {
    allowedPaths: ['README.md'],
    allowedPrefixes: ['docs/'],
    allowedExtensions: ['.md'],
    excludedNames: ['AGENTS.md', 'CLAUDE.md', 'SECURITY.md', 'SKILL.md'],
    excludedSegments: ['.git', '.agents', '.claude', '.codex', 'skills'],
    excludedPrefixes: ['docs/agents/'],
  },
  // Optional roles: the project picks the provider of the implementer and
  // of the reviewer. Without these fields the default profile setting
  // applies (codex as the implementer, claude as the reviewer). Providers
  // are the built-in ones (codex: implementer;
  // claude: implementer, experimental, or reviewer) or modules passed in
  // providerModules (see providers/example-provider.mjs and
  // docs/providers.md). CLI options override the values within these
  // allowlists.
  implementer: {
    provider: 'codex',
    model: 'gpt-6.1-sol',
    effort: 'high',
    allowedEfforts: ['medium', 'high'],
  },
  reviewer: {
    provider: 'claude',
    profiles: {
      // The fallback profile has exactly two attempts; others have one.
      critical: [
        { model: 'claude-fable-5', effort: 'high' },
        { model: 'claude-opus-5', effort: 'xhigh' },
      ],
      standard: [{ model: 'claude-opus-5', effort: 'high' }],
    },
    defaultProfile: 'standard',
    fallbackProfile: 'critical',
  },
  // Language of the runner's messages and of the implementer and reviewer
  // prompts: 'en' or 'pl'. The default task schema follows it: English
  // canonical section names with the Polish names as aliases ('en'), or the
  // reverse ('pl').
  locale: 'en',
};
