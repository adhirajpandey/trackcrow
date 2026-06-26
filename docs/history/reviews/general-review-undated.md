> Historical artifact. This review predates the current docs structure. It is preserved as context and is not the source of truth for current behavior.

## Code Review Report

### Summary
TrackCrow is a modular Next.js monolith (App Router + API routes) for expense tracking, with Prisma/Postgres persistence, NextAuth auth, and a Crow Bot orchestration layer (classifier -> intent policy -> tool execution).  
Core architecture is mostly layered (`app/api` -> `services/*` -> Prisma), but Crow Bot flow is more loosely typed than the rest.

Recent commits (last ~10) show:
1. `1e099af` large service-layer + Crow Bot refactor (high change volume, highest risk).
2. `1279c9b` relaxed classifier schema to reduce failures (improves resilience, increases contract looseness risk).
3. `0976d9c` SMS parser update for Kotak CC UPI format (small, focused).
4. `cb1a0e7` keyboard shortcut UX update on transaction detail page (localized UI risk).
5. `65bdd48` dependency/CVE updates (ops/security maintenance risk).

---

### Key Issues

#### Issue 1 — Raw SMS Data Is Logged (PII/Financial Data Exposure)
Severity: **CRITICAL**

**Problem**  
The SMS parser logs parse success/failure using `console.log`, including full unmatched SMS text.  
Evidence: [sms-parser.ts:113](/D:/projects/trackcrow/src/common/sms-parser.ts:113), [sms-parser.ts:128](/D:/projects/trackcrow/src/common/sms-parser.ts:128)

**Why It Matters**  
These messages contain sensitive financial details (merchant names, amounts, account/card fragments). This is a real security/privacy exposure in production logs.

**Suggested Fix**  
Remove raw message logging and use sanitized structured logging only (parser name + success/failure + non-sensitive metadata). Minimal change: delete lines logging full message and mapper errors with payload.

---

#### Issue 2 — `recordExpense` Can Throw Before Validation (Null Category Path)
Severity: **HIGH**

**Problem**  
`runRecordExpense` queries Prisma with `name: { equals: category }` before validating `category` shape/value. `category` can be `null` from `extractTransactionFields`.  
Evidence: [record-expense.ts:30](/D:/projects/trackcrow/src/app/crow-bot/tools/record-expense.ts:30), [record-expense.ts:85](/D:/projects/trackcrow/src/app/crow-bot/tools/record-expense.ts:85)

**Why It Matters**  
Invalid model output can cause an exception path instead of a clean validation error, producing unpredictable “tool failed” behavior and weaker reliability.

**Suggested Fix**  
Add a strict early guard before DB calls:
- if `!category || typeof category !== 'string' || !category.trim()`: return `toolFail('VALIDATION_ERROR', ...)`.

---

#### Issue 3 — Hidden API Contract: Missing `metadata.intent` Blocks Valid Intents
Severity: **HIGH**

**Problem**  
Orchestrator defaults `activeMode` to `'other'` when metadata is absent, and mode mismatch logic rejects intent unless allowed by `ALLOWED_BY_CONTEXT`. `'other'` has no allowed intents.  
Evidence: [chat-orchestrator.ts:154](/D:/projects/trackcrow/src/app/crow-bot/server/chat-orchestrator.ts:154), [intent-policy.ts:25](/D:/projects/trackcrow/src/app/crow-bot/server/intent-policy.ts:25), [server-config.ts:16](/D:/projects/trackcrow/src/app/crow-bot/config/server-config.ts:16)

**Why It Matters**  
Server behavior is tightly coupled to a specific client metadata contract. Any client missing metadata (or malformed metadata) gets false mismatch responses, even for valid requests.

**Suggested Fix**  
Treat missing/`other` mode as “no mode restriction”:
- short-circuit `checkModeMismatch` when `activeMode` is falsy/`other`.

---

#### Issue 4 — Date Query Params Aren’t Validated, So Bad Input Falls Through to 500
Severity: **MEDIUM**

**Problem**  
`listTransactions` directly does `new Date(startDateParam/endDateParam)` and injects into Prisma without validating `Invalid Date`.  
Evidence: [transaction-service.ts:125](/D:/projects/trackcrow/src/services/transactions/transaction-service.ts:125)

**Why It Matters**  
Malformed user input turns into internal errors instead of deterministic client errors (400), reducing API contract clarity and debuggability.

**Suggested Fix**  
Validate parsed dates (`!Number.isNaN(date.getTime())`) before query construction; return a `VALIDATION_ERROR` result and map that to `400` in route handler.

---

#### Issue 5 — Documented Lint Quality Gate Is Broken
Severity: **MEDIUM**

**Problem**  
`pnpm lint` currently fails (`next lint` resolves to invalid project dir with current Next version).  
Evidence: [package.json:9](/D:/projects/trackcrow/package.json:9) and runtime result from this review: `pnpm lint` exits non-zero.

**Why It Matters**  
Your stated minimum quality gate is non-functional, so regressions can slip through without static checks.

**Suggested Fix**  
Replace lint script with direct ESLint execution (for example `eslint .`) and keep CI/local docs aligned.

---

#### Issue 6 — `GET /api/user/self` Returns 500 for “User Not Found”
Severity: **LOW**

**Problem**  
When session exists but user row is absent, route throws and falls into generic 500.  
Evidence: [route.ts:26](/D:/projects/trackcrow/src/app/api/user/self/route.ts:26)

**Why It Matters**  
This is a domain-level not-found state, not an internal server failure. Incorrect status semantics make client behavior and incident triage harder.

**Suggested Fix**  
Return `404` directly for `!userDetails.data` instead of throwing.

---

### Final Assessment

**Codebase Maturity:**  
Mid

**Biggest Architectural Risk:**  
Crow Bot request flow has weak runtime contracts between classifier, intent policy, and tools, so type/shape errors are detected late and handled inconsistently.

**Highest-Impact Next Improvement:**  
Add one strict boundary validator for classified intent payloads (intent + required fields + field types) before tool dispatch, and keep all tools behind that single contract.
