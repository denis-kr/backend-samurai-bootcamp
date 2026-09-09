---
name: write-endpoint-tests
description: Write isolated vitest + supertest tests for one API endpoint in this project (real Express app + real MongoDB, no mocking). Takes two arguments — the endpoint (HTTP method + path, e.g. "POST /blogs" or "GET /posts/:id") and the location of its implementation (e.g. "src/routes/blogs-router.ts"). Use whenever the user asks to "write tests for endpoint X", "add test coverage for POST /blogs", "test this route", "cover this endpoint's edge cases", or invokes "/write-endpoint-tests <endpoint> <location>". Produces tests covering the happy path, every validation rule, auth, not-found, and boundary cases, each test self-contained and not dependent on other tests or their execution order.
---

# Write Endpoint Tests

Generates a full isolated test suite for one API endpoint, following this repo's existing conventions (real DB via `supertest` against the exported `app`, per-entity "manager" helpers, shared list-response envelope).

## Inputs

Parse two arguments from the invocation:
1. **Endpoint** — HTTP method + path, e.g. `POST /blogs`, `GET /posts/:id`, `DELETE /blogs/:id`.
2. **Location** — path to the router file implementing it, e.g. `src/routes/blogs-router.ts`.

If either is missing or ambiguous, ask the user rather than guessing — don't invent an endpoint or file.

## Workflow

1. **Read the router file at the given location** and find the exact handler for the given method+path. Note, in order:
   - The full middleware chain before the handler (validation middleware, `sendErrorsIfAnyMiddleware`, and whether `router.use(basicAuthMiddleware)` runs before this route — routes declared *above* that line in the file are unauthenticated, routes below it require Basic auth).
   - Every status code the handler itself can return (200/201/204, 404, 500) and the condition that produces each.
   - The exact response shape — this project maps Mongo docs to `{ ...doc, id: doc._id.toString(), _id: undefined }`, and list endpoints always return `{ pagesCount, page, pageSize, totalCount, items }`.

2. **Trace validation rules.** Open the relevant file(s) under `src/middleware/validation/` (per-entity file + `validation-universal.ts` for id/pagination). For each field, record: required/optional, type check, length limits, format/regex, and any async `.custom()` check (e.g. `blogId` in `validation-posts.ts` must reference a real blog). Each rule is a distinct 400 scenario — don't collapse them into one "invalid body" test.

3. **Trace one level into the domain/repo layer** (`src/domain/*-service.ts`, `src/repositories/*-repo.ts`) only far enough to know what makes a resource "not found" or what a 500 fallback guards against — don't test the repo/service directly, only through HTTP.

4. **If the endpoint's router isn't mounted in `src/setting.ts`** (e.g. the `users` domain is currently commented out end-to-end), stop and tell the user: it can't be exercised via `supertest` until it's wired up. Ask whether to write the tests anyway against the intended behavior (skip/mark them) or to hold off.

5. **Check for an existing manager** in `__tests__/utils/<entity>-manager.ts` (e.g. `blogsTestManager`, `postsTestManager`). Reuse it. If it's missing the method you need (e.g. `deleteBlog`, `getById`), add that one method following the existing style (build the request with `supertest`, set the hardcoded Basic-auth header `admin:qwerty` — base64 `YWRtaW46cXdlcnR5` — when `isAuthorized` is passed, assert `expectedStatusCode`, return the response) — don't duplicate request-building logic inline in the spec file, and don't rewrite the manager's existing methods.

6. **Check for an existing spec file** at `__tests__/<entity>.api.spec.ts`. If one exists for this entity, add a new `describe` block for this endpoint inside it rather than creating a second spec file for the same entity. Otherwise create `__tests__/<entity>.api.spec.ts` following the shape of `__tests__/blogs.api.spec.ts` (import `request` from `supertest`, `MongoClient` from `mongodb`, `app` from `../src/setting.js`, the manager).

7. **Enforce real isolation** — this is the part the user explicitly asked for, and it's currently *not* done in the existing specs (the `beforeEach`/`afterAll` calls to `DELETE /testing/all-data` are commented out in `blogs.api.spec.ts`). For the `describe` block you write:
   - Add a `beforeEach` that calls `request(app).delete("/testing/all-data")` to wipe all collections before every test.
   - Never rely on data created by a previous `it()` — if a test needs a blog to exist before testing a post endpoint, create that blog inside the same test (or a local `beforeEach`), don't reuse an id from another test.
   - Don't assume execution order; each `it()` must pass if run alone (`pnpm test -t "<name>"`).
   - Keep the existing `MongoClient` `beforeAll`/`afterAll` connect/close pattern only if the new tests actually need direct DB access (they usually don't — verify state through the API, e.g. `GET` after a `POST`/`PUT`/`DELETE`, as the existing tests do).

8. **Cover this scenario checklist**, adapted to what the endpoint actually does (skip categories that don't apply, e.g. no body validation for a GET-by-id):
   - **Happy path**: valid request → correct status code, correct response body/shape, and (for list endpoints) correct envelope fields.
   - **Auth**: if the route is below `router.use(basicAuthMiddleware)`, a request with no `Authorization` header and one with a wrong/malformed value both → 401; confirm no side effect occurred (e.g. resource wasn't created/deleted).
   - **Validation, one rule at a time**: for each field, a case that violates *only* that rule (missing/empty, wrong type, over max length, bad format) → 400 with an `errorsMessages` entry whose `field` matches. Also one case with multiple invalid fields → 400 listing them.
   - **Not found**: for `:id`/`:blogId` routes, a well-formed but non-existent id → 404.
   - **Boundary values**: exactly at a length limit (should pass) vs. one over (should fail); whitespace-only string (fails `notEmpty` after `.trim()`).
   - **Referential checks**: e.g. creating a post with a `blogId` that doesn't correspond to any blog → 400 "Invalid blog Id" (per `validation-posts.ts`), not 404.
   - **Pagination/sorting** (list endpoints only): default values when query is omitted, invalid `pageSize`/`pageNumber` (non-integer, ≤0) → 400, invalid `sortDirection` → 400, empty result set (`items: []`, `totalCount: 0`) on a clean DB.
   - **Idempotency of mutations**: e.g. `DELETE` twice — second call → 404, not 204 again.

9. **Match existing code style exactly**: TypeScript, ESM imports with explicit `.js` extensions (even though the source is `.ts` — this is NodeNext resolution), no imports from `vitest` itself (globals are on per `vitest.config.ts`), comments above each `it()` naming the route+status like `//POST /blogs 201` as in `blogs.api.spec.ts`.

10. **Run the new tests** with `pnpm test __tests__/<entity>.api.spec.ts` (requires MongoDB reachable at `MONGO_URI`, default `mongodb://localhost:27017` — if it's not reachable, say so explicitly rather than claiming the tests pass). Fix failures that stem from a wrong assumption about the endpoint's actual behavior; don't loosen assertions just to make a test pass.

## Reporting

When done, summarize: which file(s) were created/modified, the list of scenarios covered (and any from the checklist that were deliberately skipped and why), and the test run result.
