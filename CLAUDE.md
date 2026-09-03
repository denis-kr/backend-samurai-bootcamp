# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

REST API built for the "Backend Samurai" course. Express 5 + TypeScript (ESM/NodeNext) + native MongoDB driver, no ORM.

## Commands

- Install deps: `pnpm install` (pnpm is the package manager; `pnpm-lock.yaml` is committed)
- Run tests: `pnpm test` (vitest, watch mode by default — matches `**/*.spec.ts`)
- Run a single test file: `pnpm test __tests__/blogs.api.spec.ts`
- Dev server: `pnpm dev` — runs `tsc --watch` and `node --inspect=9229 --watch-path=./dist dist/src/index.js` concurrently. There is no separate one-shot `build` script; compiled output goes to `./dist` via the watching `tsc`.
- MongoDB must be reachable at `MONGO_URI` (defaults to `mongodb://localhost:27017`) for both the app and the tests, since tests hit a real API + real DB (no mocking). `docker-compose.yml` spins up a local `mongo` service and the app together.

There is no lint/format tooling configured (see `TODO.txt` — ESLint setup was deliberately deferred).

## Architecture

Layered structure, one directory per concern, wired together per-entity (blogs, posts, users):

```
routes/       Express routers — validation middleware chain, then handler calls into domain layer, then shapes the HTTP response (Mongo _id -> id)
domain/       *-service.ts — business logic, orchestrates one or more repositories
repositories/ *-repo.ts — direct MongoDB collection access (find/insert/update/delete), owns the Mongo-facing type (e.g. `Blog`, `Post`)
middleware/   auth/ (basic auth) and validation/ (express-validator chains, split per-entity + a shared "universal" set for pagination/id checks)
```

- `src/repositories/db.ts` is the single MongoDB connection point: exports the `MongoClient` and the three collections (`posts`, `blogs`, `users`) used by every repository. `runDb()` connects and pings on startup (`src/index.ts`).
- `src/setting.ts` builds and exports the Express `app` (routers mounted, JSON body parsing) separately from `src/index.ts` (which calls `runDb()` then starts listening). Tests import `app` directly and drive it with `supertest` against a real DB — they don't start the HTTP listener.
- Request handler generics (`RequestWithBody<T>`, `RequestWithQuery<T>`, `RequestWithParams<T>`, `RequestWithParamsAndBody<T,B>`, `RequestWithParamsAndQuery<T,Q>` in `src/utils/types.ts`) are the standard way to type Express `req` across routers — use these instead of typing `Request` generics inline.
- Route ordering matters: unauthenticated GET routes are declared first, then `router.use(basicAuthMiddleware)` gates everything below it (see `blogs-router.ts`). Basic auth credentials are hardcoded (`admin:qwerty`) — there's a TODO to replace this with JWT for the users routes.
- List endpoints follow one shared response envelope: `{ pagesCount, page, pageSize, totalCount, items }`, with Mongo documents mapped to `{ ...doc, id: doc._id.toString(), _id: undefined }`. Follow this shape for any new list/detail endpoint.
- `DELETE /testing/all-data` (in `src/setting.ts`) drops all three collections — used by tests/local resets, not a real product endpoint.
- The `users` domain is mid-migration: `usersRepository`/`usersService` reference a `User` type that is currently commented out in `src/repositories/users-repo.ts`, and `POST /users` in `src/routes/users-router.ts` is an unimplemented stub. Expect to need to finish this when touching users.

## Testing

- Spec files live in `__tests__/*.api.spec.ts`, driven by `supertest` against the real `app` + real MongoDB (see note above — no DB mocking).
- Shared per-entity request helpers (e.g. `blogsTestManager`, `postsTestManager`) live in `__tests__/utils/*-manager.ts` and wrap `supertest` calls with expected-status assertions; add new entity helpers there rather than duplicating request-building logic in spec files.
- Tests are expected to be isolated/independent (see comment in `blogs.api.spec.ts`), though the `beforeEach`/`afterAll` calls to `DELETE /testing/all-data` are currently commented out in that file.
