// Domyślny profil runnera: neutralne wartości bez skryptów produktu.
// Repozytorium docelowe podmienia ten plik własnym profilem; runner waliduje
// go przez resolveRunnerProfile przed uruchomieniem procesów.
//
// checks: rejestr dozwolonych kontroli. Nazwa = program i argv złączone
// spacją; program wyłącznie z allowlisty rdzenia (pnpm, git). Argv pnpm
// (args i każde nestedInvocations) ma kształt [skrypt], ['run', skrypt],
// ['--filter', pakiet, skrypt] albo ['--filter', pakiet, 'run', skrypt];
// skrypt nie może być poleceniem wbudowanym pnpm. Runner i guard zawsze
// wykonują je jako pnpm [--filter pakiet] run skrypt. Argv git to wyłącznie
// diff --check, opcjonalnie z --cached/--staged, --no-ext-diff, --no-textconv.
// Opcjonalnie: nestedInvocations (dokładne argv pnpm dozwolone w guardzie,
// gdy kontrola jest w zadaniu), passDockerHost (kontrola dostaje zwalidowany
// DOCKER_HOST), unsetCiOnDarwin (na macOS kontrola działa bez CI).
// checkSets: kontrole dodawane zawsze (base) i w torze dokumentacji (docs).
// requiredGateRules: { check, prefixes, paths, code, message? } — kandydat
// dotykający ścieżek bez jawnej kontroli check zatrzymuje run kodem code;
// code musi kończyć się na _GATE (przestrzeń nazw rozłączna z kodami rdzenia).
// taskSchema (opcjonalnie): sekcje zadania, aliasy i wersja; bez tego pola
// obowiązuje schemat domyślny rdzenia dla locale profilu (przy 'en' nazwy
// angielskie z polskimi aliasami, przy 'pl' odwrotnie).
// taskClasses (opcjonalnie): klasy jakości zadań. Poniżej klasy domyślne
// rdzenia z dokumentem polityki tego repozytorium (pole policy); rdzeń nie
// zna żadnego dokumentu polityki. Klasa bez review musi mieć docsOnly: true;
// klasa implementation jest pełnym torem (review, zestaw base, bez docsOnly).
// docsCandidatePolicy (opcjonalnie): reguła kandydata klas docsOnly; bez tego
// pola obowiązuje reguła domyślna rdzenia (README.md i docs/**/*.md).
// implementer, reviewer (opcjonalnie): dostawca, model, effort i profile
// review ról; dostawcy wbudowani (codex albo claude jako implementer, claude
// jako reviewer) albo moduły z providerModules. Bez tych pól obowiązują
// wartości domyślne rdzenia (scripts/agent-review-providers.mjs).
// providerModules (opcjonalnie): obiekty modułów dostawców importowane przez
// profil, nigdy ścieżki; kontrakt i reguły ról w docs/providers.md.
// locale (opcjonalnie): język komunikatów runnera, promptów writera
// i reviewera oraz domyślnego schematu zadań, 'en' (domyślnie) albo 'pl';
// teksty klas poniżej są po angielsku jak profil.
const REVIEW_REQUIRED = Object.freeze({
  reason:
    'The class requires independent review; analysis keeps its own contract.',
  remainingAssurance:
    'A separate checkpoint of the whole scope and a human decision before publication.',
});
const REVIEW_NOT_REQUIRED = Object.freeze({
  reason:
    'Approved docs-minor/docs-descriptive policy: writer self-check and documentation gates.',
  remainingAssurance:
    'No independent semantic review; coordinator classification, source verification by the writer and a checkpoint before publication.',
});
const TASK_QUALITY_POLICY = 'docs/development/agent-task-quality-policy.md';
const docsClass = (independentReviewRequired) =>
  Object.freeze({
    independentReviewRequired,
    checkSet: 'docs',
    docsOnly: true,
    ...(independentReviewRequired ? REVIEW_REQUIRED : REVIEW_NOT_REQUIRED),
    policy: TASK_QUALITY_POLICY,
  });
const fullClass = Object.freeze({
  independentReviewRequired: true,
  checkSet: 'base',
  docsOnly: false,
  ...REVIEW_REQUIRED,
  policy: TASK_QUALITY_POLICY,
});

export const PROFILE = Object.freeze({
  title: 'AGENT WORKFLOW',
  tempPrefix: 'agent-review-',
  checks: Object.freeze({
    'pnpm check': Object.freeze({
      program: 'pnpm',
      args: Object.freeze(['check']),
      timeoutMs: 20 * 60_000,
    }),
    'pnpm test': Object.freeze({
      program: 'pnpm',
      args: Object.freeze(['test']),
      timeoutMs: 15 * 60_000,
    }),
    'git diff --check': Object.freeze({
      program: 'git',
      args: Object.freeze(['diff', '--check']),
      timeoutMs: 2 * 60_000,
    }),
  }),
  checkSets: Object.freeze({
    base: Object.freeze(['pnpm check', 'git diff --check']),
    docs: Object.freeze(['git diff --check']),
  }),
  requiredGateRules: Object.freeze([]),
  taskClasses: Object.freeze({
    'docs-minor': docsClass(false),
    'docs-descriptive': docsClass(false),
    'docs-contract': docsClass(true),
    implementation: fullClass,
    critical: fullClass,
  }),
  locale: 'en',
});
