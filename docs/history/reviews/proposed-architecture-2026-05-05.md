# Proposed TrackCrow Architecture - 2026-05-05

## Purpose
This proposal keeps TrackCrow as a boring modular Next.js monolith while hardening the parts that matter: ownership, validation, sensitive financial data handling, typed AI/tool contracts, and query scalability.

Target functionality remains unchanged:
- Google sign-in and profile/device token management.
- Manual transaction add/edit/delete.
- SMS ingestion and parsing.
- Category/subcategory preferences and reset defaults.
- Dashboard analytics.
- Crow Bot natural-language transaction and analytics workflows.

Best-practice sources checked before proposing this:
- Next.js App Router, route handlers, data fetching, and caching: https://nextjs.org/docs/app, https://nextjs.org/docs/app/getting-started/route-handlers, https://nextjs.org/docs/app/getting-started/fetching-data, https://nextjs.org/docs/app/guides/caching
- Prisma transactions, referential actions, indexes, and performance/query insights: https://www.prisma.io/docs/orm/prisma-client/queries/transactions, https://www.prisma.io/docs/concepts/components/prisma-schema/relations/referential-actions, https://docs.prisma.io/docs/orm/prisma-schema/data-model/indexes, https://www.prisma.io/docs/optimize/faq
- Auth.js/NextAuth session extension and Next.js auth guidance: https://authjs.dev/ and https://nextjs.org/docs/app/guides/authentication
- AI SDK streaming/tool concepts: https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text
- OWASP sensitive data/security baseline: https://owasp.org/www-project-top-ten/

## High-Level Design

### Runtime
Keep one deployable Next.js application:
- Server Components render authenticated pages and fetch server-side view models.
- Client Components handle rich interactivity only: forms, chat UI, tables, charts.
- Route Handlers expose API endpoints for client fetches and external SMS ingestion.
- Server Actions handle form mutations from authenticated UI flows.
- Prisma remains the persistence layer for PostgreSQL.

### Layers
Use clear one-way dependencies:
- `src/app/**`: routing, pages, route handlers, server actions, and UI composition.
- `src/features/**`: feature-level UI and hooks for transactions, dashboard, preferences, profile, Crow Bot.
- `src/application/**`: use-case services with auth/ownership/validation orchestration.
- `src/domain/**`: pure domain types, schemas, policies, parsers, and analytics functions.
- `src/infrastructure/**`: Prisma repositories, auth adapter, logger, env validation, AI model provider.

Current code can migrate incrementally from `src/services`, `src/common`, and `src/lib` into this shape. Do not rewrite everything at once.

### Request Flow
Authenticated UI mutation:
1. Client form submits to Server Action.
2. Server Action validates raw form data into an application DTO.
3. Application service calls `requireUserSession`.
4. Application service validates ownership of all referenced IDs.
5. Repository performs the Prisma write.
6. Server Action maps result to UI state and calls `revalidatePath`.

External SMS ingestion:
1. Route Handler validates JSON body and `Authorization: Token ...`.
2. Token service hashes the presented token and resolves user.
3. SMS parser returns normalized transaction draft or parser failure.
4. Transaction service persists an `AUTO` transaction using parsed event timestamp when available.
5. Route returns safe status and never echoes raw SMS.

Crow Bot:
1. Route Handler validates `messages` shape and optional mode.
2. Classifier returns a typed `IntentEnvelope`.
3. Intent policy checks mode and missing fields.
4. Tool router validates tool input with per-tool schema.
5. Tool executes through application services, not raw Prisma access.
6. Stream mapper returns protocol-valid tool or text responses.

## Low-Level Design

### Core Contracts
Use typed result contracts consistently:

```ts
type AppResult<T, E extends string> =
  | { ok: true; data: T }
  | { ok: false; error: E; details?: unknown };
```

Standard service errors:
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `VALIDATION_ERROR`
- `DUPLICATE`
- `INVALID_REFERENCE`
- `INTERNAL_ERROR`

Route handlers map these to:
- 400 for validation.
- 401 for unauthenticated.
- 403 for cross-user or invalid ownership.
- 404 for missing owned records.
- 409 for duplicates.
- 500 only for unexpected failures.

### Ownership Guards
Add these application-level guards:
- `requireOwnedTransaction(userUuid, transactionId)`
- `requireOwnedCategory(userUuid, categoryId)`
- `requireOwnedSubcategory(userUuid, subcategoryId)`
- `requireSubcategoryInCategory(userUuid, subcategoryId, categoryId)`

Every transaction create/update must validate:
- category belongs to user when provided.
- subcategory belongs to user when provided.
- subcategory belongs to selected category when both are provided.
- uncategorized transactions explicitly set both IDs to `null`.

Every subcategory create/edit must validate:
- target category belongs to current user.
- edited subcategory belongs to current user.

### Transaction Service
Application service methods:
- `listTransactions(userUuid, query): AppResult<PaginatedTransactions, ...>`
- `createManualTransaction(userUuid, input): AppResult<TransactionId, ...>`
- `updateTransaction(userUuid, transactionId, input): AppResult<TransactionId, ...>`
- `deleteTransaction(userUuid, transactionId): AppResult<TransactionId, ...>`
- `suggestCategory(userUuid, transactionId): AppResult<CategorySuggestion, ...>`

Keep all parsing of URL/query params out of repositories. Repositories accept typed values only.

### SMS Service
Application service methods:
- `authenticateSmsToken(rawToken): AppResult<UserRef, ...>`
- `parseSmsMessage(message): SmsParseResult`
- `createSmsTransaction(userUuid, parsedSms, metadata): AppResult<TransactionId, ...>`

Rules:
- Never log raw SMS text.
- Never return raw SMS in API errors.
- Store raw SMS only if encrypted/redacted and retention is documented.
- Parse event timestamp; fallback to ingest timestamp only with an explicit `timestampSource`.

### Preferences Service
Application service methods:
- `addCategory(userUuid, name)`
- `renameCategory(userUuid, categoryId, name)`
- `deleteCategory(userUuid, categoryId)`
- `addSubcategory(userUuid, categoryId, name)`
- `renameSubcategory(userUuid, subcategoryId, targetCategoryId, name)`
- `deleteSubcategory(userUuid, subcategoryId)`
- `resetDefaults(userUuid)`

Rules:
- Normalize names consistently before uniqueness checks.
- Map unique violations to `DUPLICATE`.
- Wrap reset defaults in one Prisma transaction.

### Profile Token Service
Replace plaintext `lt_token` with device token records:
- Show raw token only on creation.
- Store only a hash.
- Allow revoke/regenerate.
- Track creation and last use.

Minimal transitional path:
- Add `lt_token_hash` nullable column.
- On next token generation, write hash and clear plaintext.
- SMS auth checks hash first, then plaintext only during migration.
- Remove plaintext column after migration.

### Dashboard Service
Add a server-only dashboard application service:
- `getDashboardViewModel(userUuid, timeframe)`

Return minimal props:
- `summary`
- `categoryBreakdown`
- `timeline`
- `trackedPreview`
- `untrackedPreview`
- `selectedTimeframe`

Do not pass full transaction arrays to multiple client components. This follows Next.js guidance to fetch on the server and send only the data needed by the rendered UI.

### Crow Bot Contracts
Define a single source of truth:

```ts
type IntentName =
  | 'recordExpense'
  | 'totalSpend'
  | 'topExpense'
  | 'expenseComparison'
  | 'transactionSearch'
  | 'dashboardSummary'
  | 'other';

type IntentEnvelope<T> = {
  intent: IntentName;
  relevance: number;
  structuredData: T;
  missingFields: string[];
};
```

Rules:
- Classifier output is untrusted until normalized.
- Missing or unknown mode either means no restriction or returns a 400; do not silently reject as `"other"` mode.
- Every tool uses `safeParse`.
- Every tool returns `ToolResult<T>`.
- Tools call application services, not raw Prisma.
- Stream mapper must emit valid text/tool parts in both success and failure paths.

### Logging And Observability
Use one logger with redaction:
- Redact `authorization`, `token`, `lt_token`, `email`, `message`, `raw_message`, `recipient`, `account`, `reference`.
- Log stable IDs and counts, not financial text payloads.
- Include request IDs for route handlers and server actions.
- Use `debug` only locally for extra context.

## Proposed Prisma Schema

This is a target shape, not a one-shot migration.

```prisma
model User {
  uuid         String        @id @default(uuid())
  id           Int           @unique @default(autoincrement())
  email        String        @unique
  name         String
  image        String?
  provider     String
  subscription Int           @default(0)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  categories   Category[]
  subcategories Subcategory[]
  transactions Transaction[]
  deviceTokens DeviceToken[]

  @@map("user")
}

model DeviceToken {
  id          Int       @id @default(autoincrement())
  userUuid    String
  tokenHash   String    @unique
  name        String?
  createdAt   DateTime  @default(now())
  lastUsedAt  DateTime?
  revokedAt   DateTime?
  user        User      @relation(fields: [userUuid], references: [uuid], onDelete: Cascade)

  @@index([userUuid])
}

model Transaction {
  uuid            String          @id @default(uuid())
  id              Int             @unique @default(autoincrement())
  userUuid         String
  amount          Decimal
  type            TransactionType @default(UPI)
  recipient       String
  recipientName   String?
  reference       String?
  account         String?
  remarks         String?
  location        String?
  categoryId      Int?
  subcategoryId   Int?
  timestamp       DateTime        @db.Timestamptz(6)
  timestampSource TimestampSource @default(USER_OR_SMS)
  inputMode       InputType
  rawMessageHash  String?
  rawMessageRedacted String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  user            User            @relation(fields: [userUuid], references: [uuid], onDelete: Cascade)
  category        Category?       @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  subcategory     Subcategory?    @relation(fields: [subcategoryId], references: [id], onDelete: SetNull)

  @@index([userUuid, timestamp])
  @@index([userUuid, recipient])
  @@index([userUuid, categoryId])
  @@index([userUuid, subcategoryId])
  @@map("transaction")
}

model Category {
  id            Int           @id @default(autoincrement())
  name          String
  normalizedName String
  userUuid       String
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  user           User          @relation(fields: [userUuid], references: [uuid], onDelete: Cascade)
  subcategories  Subcategory[]
  transactions   Transaction[]

  @@unique([normalizedName, userUuid])
  @@index([userUuid])
  @@map("category")
}

model Subcategory {
  id             Int           @id @default(autoincrement())
  name           String
  normalizedName String
  categoryId     Int
  userUuid        String
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  category        Category      @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  user            User          @relation(fields: [userUuid], references: [uuid], onDelete: Cascade)
  transactions    Transaction[]

  @@unique([normalizedName, categoryId])
  @@index([userUuid])
  @@index([userUuid, categoryId])
  @@map("subcategory")
}

enum TransactionType {
  UPI
  CARD
  CASH
  NETBANKING
  OTHER
}

enum InputType {
  AUTO
  MANUAL
}

enum TimestampSource {
  USER_OR_SMS
  INGEST_FALLBACK
}
```

Important note: Prisma cannot fully enforce "subcategory.userUuid equals category.userUuid" with the current simple relation alone. Keep application guards mandatory, and consider composite constraints only if the schema is reworked carefully.

## Migration Plan

### Phase 1 - Immediate Hardening
- Add ownership guards for category/subcategory IDs.
- Remove raw SMS/user text logging.
- Stop returning `originalMessage` from SMS failures.
- Make `totalSpend` fail on missing requested filters.
- Move Crow Bot tool parsing into safe validation paths.

### Phase 2 - Transaction Safety And Error Contracts
- Wrap onboarding defaults and preference reset in transactions.
- Normalize Prisma error mapping.
- Validate route/query payloads with typed schemas.
- Fix stream failure text protocol.
- Update docs and package-manager policy.

### Phase 3 - Schema And Token Migration
- Add indexes for transaction/user query patterns.
- Introduce hashed `DeviceToken`.
- Backfill or regenerate device tokens.
- Add parsed SMS timestamp support.
- Add redacted/hash raw message fields if raw SMS retention remains required.

### Phase 4 - Decomposition For Maintainability
- Split `TransactionsClient`.
- Extract shared transaction form fields/schema.
- Add dashboard view-model service.
- Move Crow Bot tools to application services instead of raw Prisma.

## Test Strategy

Minimum CI gate:
- `pnpm test -- --runInBand`
- `eslint .`
- `pnpm build`

High-value tests:
- Cross-user category/subcategory ID rejection for manual create/update.
- Preference subcategory cannot be created under another user's category.
- Reset defaults is atomic on simulated failure.
- SMS parser extracts amount, recipient, type, account, reference, and timestamp for every supported format.
- SMS route never returns raw message on 422.
- `totalSpend` returns `NOT_FOUND` for unknown requested filters.
- Crow Bot tools convert bad model output to `VALIDATION_ERROR`, not generic stream failures.
- Dashboard service returns bounded view models for large transaction sets.

## Recommended First PR
The first PR should not attempt the full architecture. It should do only:
- Add ownership guards.
- Apply them to transaction create/update and preference subcategory create/edit.
- Add regression tests for cross-user ID rejection.
- Remove raw SMS logging and `originalMessage` response details.

That PR has the highest risk reduction per line changed.
