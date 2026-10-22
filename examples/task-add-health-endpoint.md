# Add a health endpoint to the example API

<!--
Synthetic implementation task for examples/project-profile.mjs.
Section headings (level 2 to 6, case insensitive) use the canonical names of
the default task schema for locale 'en'. The Polish names are aliases of the
same sections: Goal = Cel, Scope = Zakres, Acceptance criteria = Kryteria
akceptacji, Required checks = Wymagane kontrole, Constraints = Ograniczenia,
Deferred items = Elementy odłożone (also "Deferred"). Optional: Task class =
Klasa zadania (level 2 only), Starting files = Pliki startowe, Allowed change
area = Dozwolony obszar zmian, Review files = Pliki review (analysis mode).
Body text may be in any language.
-->

## Task class

implementation

## Goal

Expose a read-only health endpoint in the example API so that a load balancer
can check whether the service is up.

## Scope

- Add a GET route at /health in packages/api/src/routes/health.ts that
  returns status 200 and the JSON body {"status":"ok"}.
- Register the route in packages/api/src/server.ts.
- Add a unit test next to the route.

## Starting files

- packages/api/src/server.ts
- packages/api/src/routes/

## Allowed change area

- packages/api/src/routes/
- packages/api/src/server.ts

## Acceptance criteria

- GET /health returns 200 with {"status":"ok"} and no other fields.
- The endpoint does not read the database or any configuration value.
- The new unit test fails without the route and passes with it.

## Required checks

- `pnpm test`
- `pnpm --filter @example/api run test:integration`

## Constraints

- Do not add or update dependencies.
- Do not change files under packages/api/src/db/.
- Do not commit, push or open a pull request.

## Deferred items

- Readiness checks for downstream services.
- Metrics endpoint.
