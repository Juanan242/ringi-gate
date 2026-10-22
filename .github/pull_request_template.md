## Summary

<!-- One topic per pull request. Link the issue it addresses (e.g. Closes #12). -->

## Changes

-

## Fail-closed impact

<!-- Does this widen what agents, tasks or gates may do (allowlists, guards,
path rules, environment)? If so, why, and which test covers the new
boundary? Does any stop code, CLI option or report field change? -->

## Checklist

### Tests

- [ ] `npm test` passes locally.
- [ ] `node --test examples/validate-examples.test.mjs` passes locally.
- [ ] A behaviour change comes with a test that fails without it.
- [ ] No fail-closed check was loosened to make a test pass.
- [ ] Surface contract tests changed only for an intended change, explained above.

### Claims match code

- [ ] README and `docs/` describe only implemented behaviour; plans are in `ROADMAP.md`.
- [ ] Examples in `examples/` still match the core (or were updated with it).

### No secrets or real data

- [ ] No secrets, tokens or credentials in code, tests, examples, docs or logs.
- [ ] No real names, e-mail addresses, private paths or project data; synthetic values only.
