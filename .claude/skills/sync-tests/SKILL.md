---
name: sync-tests
description: Write new tests and/or update existing tests based on the current uncommitted/unstaged code changes in this project — no endpoint or file needs to be named, it's derived from `git diff`. Use whenever the user asks to "write tests for my changes", "update tests for what I just did", "make sure tests cover this", "sync tests with the diff", or invokes "/sync-tests" with no arguments. Diffs every changed file (routes, validation, domain, repositories, types) against existing specs, adds coverage for new behavior, and fixes assertions that now contradict changed behavior — never deletes coverage for something that's still intentional.
---

# Sync Tests

Looks at what's actually uncommitted right now, figures out which endpoints/behaviors it touches, and brings `__tests__/*.api.spec.ts` in line — adding tests for new behavior, updating tests whose assertions no longer match reality, and leaving everything else alone.

## Workflow

1. **Get the real diff first — never guess from conversation memory.**
   ```bash
   git status --short
   git diff
   git diff --cached
   ```
   Include untracked new files (`??` in status) — read them directly, a diff won't show their content. If there are no changes at all, tell the user there's nothing to sync and stop.

2. **Classify every changed file** into one of:
   - `src/routes/*-router.ts` — new/changed/removed route, changed middleware order (e.g. a route moved above/below `router.use(basicAuthMiddleware)`), changed status codes or response shaping.
   - `src/middleware/validation/*.ts` — new/changed/removed validation rule (required/optional, length, format, `.custom()` checks) for an entity, or a change to the shared universal (pagination/id) chain.
   - `src/domain/*-service.ts` / `src/repositories/*-repo.ts` — changed business logic or query behavior that's only observable through the HTTP layer (e.g. a new not-found condition, a changed sort/filter default, a field added to/removed from the persisted type).
   - `src/utils/types.ts`, `src/setting.ts` — structural changes (new request generic, route mounted/unmounted, new global middleware) that may affect many entities at once.
   - Anything under `__tests__/` itself — likely already-intentional test changes; note them but don't "fix" them back.

   For each, note **which entity** (blogs/posts/users/...) and **which HTTP method+path** it affects. A single file can affect multiple endpoints (e.g. `validation-universal.ts` affects every paginated list endpoint).

3. **For each affected entity, read what already exists** before writing anything:
   - `__tests__/<entity>.api.spec.ts` — the current spec file, if any.
   - `__tests__/utils/<entity>-manager.ts` — the current request-helper methods.
   - The router/validation/service/repo files for that entity, to establish current (post-change) behavior.

4. **Diagnose each affected endpoint into exactly one bucket:**
   - **New endpoint / new route** → no existing tests reference it. Write a full new `describe` block from scratch.
   - **New scenario on an existing endpoint** (new validation rule, new status code path, new query param, new field in the response) → existing tests still pass, but a scenario is missing. Add new `it()`s alongside the existing ones; don't touch what already passes.
   - **Changed behavior that breaks an existing assertion** (a status code changed, a field was renamed/removed from the response, a validation rule was loosened/tightened, a default changed) → find the specific `it()`(s) asserting the old behavior and update only the assertions that are now wrong. Don't rewrite the whole test or its surrounding structure.
   - **Removed endpoint/field** → find tests that only make sense for the removed behavior and remove them, but say so explicitly in your final report — don't silently delete coverage.

   If a change's intent is ambiguous (e.g. you can't tell whether an assertion is now wrong or whether the code change itself is a bug), stop and ask rather than guessing which one to "fix".

5. **When writing or updating a test, follow this repo's existing conventions exactly** (see `__tests__/blogs.api.spec.ts` as the reference shape):
   - Reuse the entity's manager (`__tests__/utils/<entity>-manager.ts`) for request-building; add a method there if one's missing rather than inlining `supertest` calls in the spec.
   - Real isolation: a `beforeEach` calling `request(app).delete("/testing/all-data")`; never depend on data created by another `it()` or on execution order.
   - ESM imports with explicit `.js` extensions, no imports from `vitest` itself (globals per `vitest.config.ts`), a comment above each `it()` naming the route+status (e.g. `//POST /blogs 201`).
   - The shared list envelope `{ pagesCount, page, pageSize, totalCount, items }` and the `{ ...doc, id, _id: undefined }` mapping, if the endpoint is a list/detail route.
   - If the endpoint's router isn't mounted in `src/setting.ts` (e.g. anything still in the `users` mid-migration state), stop and tell the user it can't be exercised via `supertest` yet — ask whether to write it anyway (skipped/marked) or hold off.

6. **Use this scenario checklist** for any new endpoint or new scenario (skip categories that don't apply): happy path; auth (401 for missing/malformed `Authorization` if the route sits below `basicAuthMiddleware`); each validation rule individually (not collapsed into one "invalid body" case); not-found for `:id`/`:blogId` routes; boundary values (at vs. over a length limit, whitespace-only); referential checks (e.g. a `blogId` that doesn't exist → 400, not 404); pagination/sorting defaults and invalid values; idempotency of mutations (deleting twice → second call 404).

7. **Run the affected spec file(s)** with `pnpm test __tests__/<entity>.api.spec.ts` (requires MongoDB reachable at `MONGO_URI`, default `mongodb://localhost:27017` — if unreachable, say so explicitly rather than claiming success). Fix failures that stem from a wrong assumption about the changed behavior; don't loosen an assertion just to make a test pass — if a test fails because the new code actually looks buggy, flag that to the user instead of "fixing" the test to match it.

## Reporting

Summarize, per entity: which file(s) were created/modified, which scenarios were added, which existing assertions were updated (and what changed), any coverage removed (and why), anything skipped/flagged as ambiguous, and the test run result.
