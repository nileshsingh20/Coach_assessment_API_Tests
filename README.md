# Coach Assess API Automation Suite

TypeScript + Playwright API test suite for the Coach Assess public API
(`https://assess.coachlms.org/api/public/v1`).

## Project structure

```
coach-assess-api-suite/
├─ playwright.config.ts       # base URL, HTML report, timeouts
├─ .env.example                # copy to .env — never commit real keys
├─ .gitignore
├─ src/
│  ├─ api/
│  │  ├─ client.ts             # CoachAssessClient: one method per endpoint
│  │  └─ httpContext.ts        # fetch-based HTTP layer (see "Why fetch, not
│  │                           # Playwright's request API" below)
│  ├─ types/index.ts           # request/response TypeScript interfaces
│  ├─ fixtures/test-fixtures.ts# allScopesClient / 5 single-scope clients / invalidClient
│  └─ utils/
│     ├─ testData.ts           # unique emails, external ids, future dates
│     ├─ discovery.ts          # resolves an assessment id to test against
│     └─ seedAttempt.ts        # invites a throwaway candidate, returns its attemptId
└─ tests/
   ├─ smoke/me.spec.ts
   ├─ assessments/
   │  ├─ list-assessments.spec.ts
   │  ├─ get-assessment.spec.ts
   │  ├─ shareable-link.spec.ts          # POST/GET/PATCH/DELETE/regenerate
   │  └─ list-candidates-on-assessment.spec.ts
   ├─ candidates/
   │  ├─ list-candidates.spec.ts
   │  ├─ create-update-candidate.spec.ts
   │  └─ get-and-update-candidate.spec.ts
   ├─ invitations/
   │  └─ invite-candidates.spec.ts
   ├─ attempts/
   │  ├─ get-attempt.spec.ts
   │  ├─ resend-attempt.spec.ts
   │  ├─ reschedule-attempt.spec.ts
   │  ├─ extend-attempt.spec.ts
   │  ├─ close-attempt.spec.ts
   │  └─ bulk-attempts.spec.ts
   └─ results/
      ├─ get-candidate-results.spec.ts
      ├─ list-results.spec.ts
      ├─ get-assessment-results.spec.ts
      └─ get-full-result.spec.ts
```

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | Required | Purpose |
|---|---|---|
| `COACH_ASSESS_BASE_URL` | no (has default) | API base URL |
| `COACH_ASSESS_API_KEY_ALL` | **yes** | A key holding all 5 scopes. Used for cross-cutting setup (discovering an assessment, seeding a candidate) and the `/me` smoke test — never for the scope assertions themselves. |
| `COACH_ASSESS_API_KEY_ASSESSMENTS_READ` | no | `assessments:read` only |
| `COACH_ASSESS_API_KEY_CANDIDATES_READ` | no | `candidates:read` only |
| `COACH_ASSESS_API_KEY_CANDIDATES_WRITE` | no | `candidates:write` only |
| `COACH_ASSESS_API_KEY_INVITATIONS_WRITE` | no | `invitations:write` only |
| `COACH_ASSESS_API_KEY_RESULTS_READ` | no | `results:read` only |
| `COACH_ASSESS_TEST_ASSESSMENT_ID` | no | Pin tests to one assessment instead of auto-discovering the first active one via `GET /assessments`. Recommended for a stable CI run. |
| `COACH_ASSESS_TEST_CUSTOM_FIELD_KEY` | no | The key of **one** real custom candidate field configured in your org (dashboard: Candidates › Fields). Only used by the "stores custom directory fields" test. **Not a list** — `.env` has no OR/multi-value syntax, so put exactly one field key here, not several comma-separated. |

Only `COACH_ASSESS_API_KEY_ALL` is required — every test needing one of the
five single-scope keys (or the custom-field key) calls `test.skip(!x, ...)`
if its env var is unset, so the suite runs cleanly with just the one key
and gains coverage as you add the rest.

## Running

```bash
npm test                    # everything
npm run test:assessments    # just the assessments folder
npm run test:candidates
npm run test:invitations
npm run test:attempts
npm run test:results
npm run test:ui             # Playwright's interactive UI runner
npm run report              # open the last HTML report
```

Every run writes a full HTML report to `playwright-report/index.html`
(every test, timings, and the failure diff for anything that didn't
match) — `npm run report` opens the most recent one.

## Why fetch, not Playwright's own request API

`CoachAssessClient` (`src/api/client.ts`) is built on a small custom HTTP
layer (`src/api/httpContext.ts`) using Node's native `fetch`, **not**
Playwright's built-in `APIRequestContext`.

Playwright's own request context routes through its bundled network stack
(shared with its browser-automation internals), and in testing against
the real API it was intermittently blocked or served a stale/placeholder
response — a cached copy of the frontend's `index.html` on some `GET`
calls, and even a `405` on a `POST` endpoint that worked fine called
directly. Plain `curl` and Node's native `fetch` reliably reached the real
API every time. The suspected cause is bot/WAF fingerprinting in front of
`assess.coachlms.org` (it's Vercel-hosted) flagging Playwright's distinct
network fingerprint — nothing about the API contract itself.

`httpContext.ts` wraps native `fetch` behind the same method shape
Playwright's `APIResponse` has (`status()`, `ok()`, `json()`, `text()`,
`headers()` — all methods, not properties), so nothing else — fixtures,
tests, the `.raw` escape hatch — had to change to adopt it. Playwright is
still used as the test runner (`test`, `expect`, `describe`, the HTML
reporter) — only the actual network calls bypass its request layer.

`CoachAssessClient.cacheBustParams()` additionally appends a random query
param to every request, so no URL is ever identical twice — a defense
against any CDN edge cache (good or bad) matching a prior response.

## Design notes

- **One typed method per endpoint** on `CoachAssessClient`. `client.raw`
  exposes the underlying `httpContext` for one-off malformed-body tests
  (e.g. asserting `422` on a missing required field) — always pass
  `params: client.cacheBustParams()` on these so they get the same
  cache-busting as every wrapped method.
- **Fixtures** (`src/fixtures/test-fixtures.ts`) expose `allScopesClient`
  (required) plus five optional single-scope clients —
  `assessmentsReadClient`, `candidatesReadClient`, `candidatesWriteClient`,
  `invitationsWriteClient`, `resultsReadClient` — each resolving to `null`
  if its key isn't configured. Tests needing one call
  `test.skip(!client, ...)` rather than failing outright.
- **Real scope isolation, not just a generic 403**: a positive test
  proves the matching single-scope key works, and a negative test proves
  a *different* single-scope key — deliberately not the one the endpoint
  needs — gets `403 insufficient_scope`. The shareable-link and attempts
  specs go further, since their `GET` needs `assessments:read`/
  `candidates:read` but every mutation needs `invitations:write` — each
  proves its key can do exactly its half and no more.
- **Test data is disposable**: every candidate/invitation test generates a
  fresh, timestamped email via `uniqueEmail()`, and any `externalId` sent
  uses `randomExternalId()` — never a fixed literal, since a hardcoded
  value collides with the same candidate from a previous run and 409s.
- **`resolveAssessmentId()`** reads `COACH_ASSESS_TEST_ASSESSMENT_ID` if
  set, otherwise discovers the first active assessment via
  `allScopesClient` (setup, not the thing under test).
- **`seedAttempt()`** invites a fresh, disposable candidate via
  `allScopesClient` and returns the resulting `attemptId` — every
  attempts/results test needs a real attempt to act on, and this is how
  it gets one without depending on data already existing in your org.
- The shareable-link lifecycle runs `serial` since it
  creates/patches/revokes/regenerates state on one assessment in
  sequence; a separate "scope enforcement" describe block in the same
  file covers the 403 cases without disturbing that sequence.
- **Results tests mostly can't reach "completed"** — that requires a
  candidate to actually take the assessment, which nothing in this API
  triggers. `get-full-result.spec.ts` asserts the realistic, deterministic
  case instead: a freshly-seeded attempt returns `202` ("not ready yet").
  The list/paginated results endpoints just assert the paginated shape.
- **`POST /attempts/bulk`'s request body was inferred**, not documented —
  the docs page's example sends `{}` with no field list. The suite
  assumes `{ action, attemptIds, ...action-specific fields }` (see the
  comment on `BulkAttemptsRequestBody` in `src/types/index.ts`). If it
  422s with an unfamiliar field name in `error.details`, that's this
  schema to fix.

## Known doc-vs-reality gaps

A few places where the live API's actual behavior differs from what the
endpoint docs describe. The suite is written to pass against the
*observed* behavior (with a comment at each spot), but these are worth
flagging to whoever maintains the Coach Assess docs:

| Endpoint | Docs say | Observed |
|---|---|---|
| `GET /assessments/{id}/candidates` | `result` is omitted without `results:read` | `result` is present but `null` |
| `POST /attempts/{id}/reschedule` on an already-sent invite | `409` | `400` |
| `PATCH /candidates/{id}` changing the (immutable) email | `422 validation_error` | `409` |

## Coverage

All 15 documented endpoints (Assessments, Candidates, Invitations,
Attempts, Results) are covered — 120 tests total, following the same
happy-path → validation → not-found → auth → scope pattern throughout.