# TrackCrow API

This document describes the current HTTP API exposed from `src/app/api/*`.

## Common Behavior

- All `:id` path params in these routes are UUIDs.
- Most routes require a valid NextAuth session and return `401` with `{ "message": "Unauthorized" }` when the session is missing.
- `POST /api/imports/sms` is the session exception. It accepts `Authorization: Token <plain-token>` and `Authorization: Bearer <plain-token>` and requires `sms:import`.
- Controllers validate params, query strings, and JSON bodies with Zod before calling services.

Common error responses:

| Status | Shape | When it is used |
| --- | --- | --- |
| `400` | `{ message: "Invalid request", issues? }` | schema validation failure |
| `400` | `{ message: "Invalid JSON body" }` | malformed JSON |
| `400` | `{ message: "Invalid payload", issues? }` | malformed SMS import payload |
| `401` | `{ message: "Unauthorized" }` | missing session or invalid import token |
| `404` | `{ message: "Not found" }` | missing user-owned resource |
| `409` | route-specific conflict message, optional `details` | uniqueness or alias-transfer conflict |
| `422` | route-specific message, optional `details` | unprocessable SMS import |
| `500` | `{ message: "Internal Server Error" }` | unexpected failure |
| `503` | sanitized service-unavailable response | token or limiter storage failure |

All success responses are JSON.

### Personal API tokens

`GET /api/tokens`, `POST /api/tokens`, and `DELETE /api/tokens/:id` require a browser session. Personal API tokens cannot manage tokens. Create requires a nonempty name and at least one immutable scope from `TRANSACTIONS_READ`, `TRANSACTIONS_WRITE`, and `SMS_IMPORT`. Creation returns plaintext once alongside the token record. List responses contain only UUID, prefix, scopes, creation time, approximate last-used source timestamp, and revocation time.

The existing `/api/device-tokens` routes remain available. Legacy creation grants only `SMS_IMPORT`.

### MCP

MCP accepts personal API tokens and OAuth access tokens. Authentication failures include `WWW-Authenticate: Bearer resource_metadata="<issuer>/.well-known/oauth-protected-resource/mcp"` when OAuth is configured. OAuth credentials are valid only for `/mcp`, never SMS import. Authenticated OAuth traffic uses the connection's rate-limit budget, while each access token retains its own identity. Invalid credentials use the existing IP failure budget.

### MCP OAuth

TrackCrow acts as the authorization server using its existing Google/NextAuth session. Only public CIMD clients with `token_endpoint_auth_method: "none"` are supported. There is no registration endpoint or manual client registry.

| Endpoint | Behavior |
| --- | --- |
| `GET /.well-known/oauth-protected-resource/mcp` | Resource, authorization server, and supported MCP scopes. |
| `GET /.well-known/oauth-authorization-server` | Authorization/token endpoints, CIMD support, `S256`, and supported grants. |
| `GET /oauth/authorize` | Validate CIMD client, redirect, `response_type=code`, explicit scopes, resource, and PKCE; start browser consent. |
| `GET /oauth/consent` | Resume browser-bound consent; sign in with Google if needed. |
| `POST /oauth/consent/submit` | Same-origin, session-authenticated form submission. Select a subset of requested scopes or deny. |
| `POST /oauth/token` | Form-encoded authorization-code or refresh-token exchange. |
| `GET /api/oauth/connections` | List the session user's connection snapshots, permissions, and timestamps. |
| `DELETE /api/oauth/connections/:id` | Same-origin, session-authenticated revocation, scoped to the owning user. |

Authorization requires `client_id`, `redirect_uri`, `response_type=code`, `scope`, `resource`, `code_challenge`, and `code_challenge_method=S256`. Optional client `state` is echoed unchanged. Only `transactions:read` and `transactions:write` are accepted. Read is preselected when requested; write requires explicit selection. Empty consent is denial. Each successful approval creates a distinct connection.

The client ID is a public HTTPS metadata URL. Redirects must match its current metadata, with variable ports allowed only for HTTP loopback IP callbacks. Discovery supports public CORS; token and MCP browser requests use `MCP_ALLOWED_ORIGINS`. Consent never enables cross-origin credentials.

Code exchange requires `grant_type=authorization_code`, `client_id`, `code`, `redirect_uri`, `resource`, and `code_verifier`. Refresh requires `grant_type=refresh_token`, `client_id`, `refresh_token`, and `resource`; optional `scope` may only narrow the current token's scopes. Both return `access_token`, `refresh_token`, `token_type: "Bearer"`, `expires_in`, and actual granted `scope` with `Cache-Control: no-store`. OAuth errors use an `error` field; storage failures return `503 temporarily_unavailable` and throttling returns `429` with `Retry-After`.

Codes last five minutes; access tokens last one hour. Connections expire 90 days after initial approval, and all refresh tokens inherit that fixed deadline. Access expiry is capped at the deadline. Every refresh rotates the token and records its successor. Reusing a consumed refresh token revokes the entire connection. Revocation also invalidates access tokens and unredeemed codes. Client metadata is fetched only within new authorization flows; existing grants retain their stored identity and scopes.

OAuth endpoints limit authorization and consent to 20 requests/minute per IP and token exchanges to 60. Form bodies are capped at 16 KiB. Tool permissions remain enforced by existing MCP tool checks; HTTP scope-upgrade challenges are deferred.

### MCP transport

`POST /mcp` is a stateless MCP endpoint and accepts only `Authorization: Bearer <token>`. It supports current MCP v2 requests and older stateless Streamable HTTP clients. `GET` and `DELETE` return `405`. An `Origin` header must match a comma-separated entry in `MCP_ALLOWED_ORIGINS`; native clients may omit it. Bodies above 64 KiB return `413`, including streamed bodies without `Content-Length`. Responses use `Cache-Control: no-store`.

Authenticated tokens may make 120 POST requests per minute. Invalid credentials share a ten-attempt-per-minute client-IP budget. A blocked request returns `429` with `Retry-After`.

The seven tools are `search_transactions`, `get_spending_summary`, `list_categories`, `list_accounts`, `search_recipients`, `create_transaction`, and `categorize_transaction`. Read tools require `transactions:read`; mutation tools require `transactions:write`. Inputs reject unknown fields and never accept `userUuid`. Read dates are inclusive Asia/Kolkata calendar days. Manual creation uses INR, requires an existing recipient, accepts an optional existing account UUID, and is non-idempotent. Do not retry creation after an uncertain response because the first call may have succeeded.

## Routes

### Auth

### `GET|POST /api/auth/[...nextauth]`

NextAuth handler for Google sign-in and session flows.

### User

### `GET /api/me`

Returns the current user:

- `uuid`
- `id`
- `email`
- `name`
- `image`
- `subscription`

### Categories

### `GET /api/categories`

Returns category options for the current user:

- `uuid`
- `name`
- `subcategories[]` with `uuid`, `name`, `categoryUuid`

### `POST /api/categories`

Request body:

```json
{ "name": "Food" }
```

Returns `201` with `{ "uuid": "..." }`.

### `PATCH /api/categories/:id`

Same body as create. Returns `{ "uuid": "..." }`.

### `DELETE /api/categories/:id`

Returns `{ "uuid": "..." }`.

### `POST /api/categories/reset-defaults`

Deletes the current user's categories and subcategories, then reseeds defaults. Returns `{ "reset": true }`.

### Subcategories

### `POST /api/subcategories`

Request body:

```json
{ "name": "Lunch", "categoryUuid": "..." }
```

Returns `201` with `{ "uuid": "..." }`.

### `PATCH /api/subcategories/:id`

Same body as create. Returns `{ "uuid": "..." }`.

### `DELETE /api/subcategories/:id`

Returns `{ "uuid": "..." }`.

### Accounts

`GET /api/accounts` returns the current user's accounts as `{ "uuid", "name" }`, ordered by name.

`POST /api/accounts` accepts `{ "name": "Kotak" }`. `PATCH /api/accounts/:accountUuid` accepts the same body. Names are trimmed and repeated whitespace is collapsed. Names that differ only by casing or whitespace conflict within one user and return `409`. Unknown accounts and accounts owned by another user both return `404` on rename.

Accounts cannot be deleted through the API.

### Transactions

### `GET /api/transactions`

Supported query params:

- `page`
- `size`
- `q`
- `sortBy=amount|timestamp`
- `sortOrder=asc|desc`
- `startDate`
- `endDate`
- repeated `category` params or comma-separated `categories`
- repeated `subcategory` params or comma-separated `subcategories`
- repeated `classificationSource=MANUAL|SUGGESTION|RULE` params

Transaction list filters are validated as UUID/string inputs. `startDate` and `endDate` are interpreted as day boundaries in IST when sent as `YYYY-MM-DD`.

Returns:

- `transactions[]`
- `page`
- `pageSize`
- `total`
- `totalPages`
- `hasNext`
- `hasPrev`
- `firstTxnDate`
- `lastTxnDate`

Each transaction includes:

- `uuid`, `userUuid`, `recipientUuid`
- `amount`, `currency`, `type`, `source`
- `recipientDisplayName`
- `reference`, `accountUuid`, `accountName`, `remarks`, `locationRaw`
- `timestamp`, `createdAt`, `updatedAt`
- `category`, `subcategory`, `categoryUuid`, `subcategoryUuid`
- `classificationSource` and `classificationChangedAt`

### `POST /api/transactions`

Creates a manual transaction and forces `source` to `MANUAL`.

Request body:

```json
{
  "amount": 120,
  "recipientUuid": "...",
  "categoryUuid": "...",
  "subcategoryUuid": "...",
  "type": "UPI",
  "remarks": "Dinner",
  "timestamp": "2026-06-21T10:00:00.000Z",
  "reference": "123",
  "accountUuid": "...",
  "locationRaw": "Bangalore"
}
```

`categoryUuid`, `subcategoryUuid`, and `accountUuid` may be `null`. The server verifies that an account belongs to the authenticated user. `accountLabel` is no longer accepted. Manual creation records `classificationSource: "MANUAL"`. Returns `201` with `{ "uuid": "..." }`.

### `GET /api/transactions/:id`

Returns one transaction DTO with the same fields as the list item plus `recipientRaw`, `recipientName`, and `classificationRule`.

`classificationRule` is either `null` or contains `uuid`, `name`, and `isDeleted` for the rule that assigned the current classification.

### `PATCH /api/transactions/:id`

Same shape as create, except `recipientUuid` is not accepted. Omitting `accountUuid` preserves the current account; sending `null` clears it. The optional `classificationIntent: "SUGGESTION"` marks the category change as an accepted suggestion and requires both `categoryUuid` and `subcategoryUuid` to be present. Returns `{ "uuid": "..." }`.

When the submitted category pair no longer matches the current suggestion, returns `409` with:

```json
{
  "message": "The category suggestion is no longer current",
  "code": "TRANSACTION_SUGGESTION_CONFLICT",
  "details": {
    "suggestion": { "categoryUuid": "...", "subcategoryUuid": null }
  }
}
```

### `PATCH /api/transactions/:id/category`

Request body:

```json
{
  "categoryUuid": "...",
  "subcategoryUuid": "...",
  "classificationIntent": "SUGGESTION"
}
```

`categoryUuid` may be `null` to clear the category. `classificationIntent` is optional; when supplied, it has the same validation and stale-suggestion conflict behavior as the full transaction update. Direct category edits record `classificationSource: "MANUAL"`, while verified suggestions record `"SUGGESTION"`. Both clear any prior rule link. Returns:

- `uuid`
- `categoryUuid`
- `category`
- `subcategoryUuid`
- `subcategory`

### `DELETE /api/transactions/:id`

Returns `{ "uuid": "..." }`.

### `GET /api/transactions/:id/suggest`

Returns:

- `suggestedCategory`
- `suggestedSubCategory`
- `suggestedCategoryUuid`
- `suggestedSubcategoryUuid`

The suggestion is based on prior categorized transactions for the same resolved recipient.

### Rules

Rules classify future imported transactions by resolved recipient. All rule routes require a valid session and operate only on the current user's data.

Each rule DTO contains:

- `uuid`, `name`, `isEnabled`, `actionStatus`
- `conditions: { recipient: { equals: recipientUuid } }`
- `recipient: { uuid, displayName }`
- `action` with `type`, `categoryUuid`, `categoryName`, `subcategoryUuid`, and `subcategoryName`
- `createdAt`, `updatedAt`

`action.type` is `CATEGORIZE` or `IGNORE`. An `IGNORE` rule reports every category field as `null`.

`actionStatus` is `VALID` or `NEEDS_REPAIR`. Deleted rules are omitted from rule reads, but may remain visible as historical `classificationRule` metadata on transaction details.

### `GET /api/rules`

Supported query params:

- `page`, default `1`
- `size`, default `20`, maximum `100`
- `q`, a case-insensitive rule-name or recipient-name search
- `status=enabled|disabled|needsRepair`

The `disabled` filter returns valid disabled rules; repair-required rules use the separate `needsRepair` status. Returns:

- `rules[]`
- `page`, `pageSize`, `total`, `totalPages`, `hasNext`, `hasPrev`

### `POST /api/rules`

Request body:

```json
{
  "name": "Classify Swiggy as Food",
  "isEnabled": true,
  "conditions": {
    "recipient": { "equals": "..." }
  },
  "action": {
    "categoryUuid": "...",
    "subcategoryUuid": "..."
  }
}
```

`action` is one of two shapes. A categorizing action carries `categoryUuid` and `subcategoryUuid`, with an optional `"type": "CATEGORIZE"`; omitting `type` means `CATEGORIZE`. An ignoring action is exactly `{ "type": "IGNORE" }` and must carry no category fields:

```json
{ "action": { "type": "IGNORE" } }
```

An enabled `IGNORE` rule makes future SMS imports for that recipient create no transaction. Manual and MCP transaction creation is unaffected. Mixing the two shapes, such as sending `categoryUuid` with `"type": "IGNORE"`, returns `400`.

The name is trimmed and must contain 1–100 characters. Recipient, category, and optional subcategory UUIDs must belong to the current user, and the subcategory must belong to the selected category. Returns `201` with the full rule DTO.

Only one non-deleted enabled rule may exist per recipient. Creating or enabling a conflicting rule returns `409` with:

```json
{
  "message": "An enabled rule already exists for this recipient",
  "code": "RULE_RECIPIENT_CONFLICT",
  "details": {
    "existingRule": { "uuid": "...", "name": "..." }
  }
}
```

### `GET /api/rules/:ruleUuid`

Returns the full rule DTO, or `404` when the rule is missing, deleted, or not owned by the current user.

### `PATCH /api/rules/:ruleUuid`

Accepts any non-empty subset of `name`, `isEnabled`, `conditions`, and `action` using the same shapes and ownership validation as creation. A `NEEDS_REPAIR` rule cannot be enabled until a valid action is supplied. An `IGNORE` rule may be enabled without a category. Returns the updated rule DTO.

### `DELETE /api/rules/:ruleUuid`

Soft-deletes the rule by disabling it and setting `deletedAt`. Existing transactions are unchanged. Returns `{ "uuid": "..." }`.

### Dashboard

### `GET /api/dashboard/summary`

Optional query params:

- `startDate`
- `endDate`

Returns:

- `totalSpend`
- `transactionCount`
- `categorizedCount`
- `uncategorizedCount`
- `averageSpend`

### `GET /api/dashboard/spending-by-category`

Optional `startDate` and `endDate`. Returns an array of:

- `category`
- `totalSpend`
- `transactionCount`

Transactions without a category are grouped under `"Uncategorized"`.

### `GET /api/dashboard/spending-by-period`

Optional query params:

- `startDate`
- `endDate`
- `granularity=day|week|month|year`

Returns an array of:

- `period`
- `totalSpend`
- `transactionCount`

### Recipients

### `GET /api/recipients`

Supported query params:

- `page`
- `size`
- `q`
- `sortBy=displayName|transactionCount|totalAmount`
- `sortOrder=asc|desc`
- `minTransactionCount` (optional non-negative integer, inclusive)
- `maxTransactionCount` (optional non-negative integer, inclusive)
- `minTotalAmount` (optional non-negative number, inclusive)
- `maxTotalAmount` (optional non-negative number, inclusive)

When both bounds for a metric are supplied, the maximum must be greater than or equal to the minimum. Aggregate filters are applied before sorting and pagination.

Returns:

- `recipients[]`
- `page`
- `pageSize`
- `total`
- `totalPages`
- `hasNext`
- `hasPrev`

Each recipient includes:

- `uuid`
- `displayName`
- `normalizedName`
- `transactionCount`
- `totalAmount`
- `aliases[]` with `uuid`, `aliasType`, `value`, `normalizedValue`

### `POST /api/recipients`

Request body:

```json
{ "displayName": "Merchant" }
```

Returns `201` with:

- `uuid`
- `displayName`
- `normalizedName`

On duplicate name, returns `409` with `{ "message": "A recipient with this name already exists" }`.

### `GET /api/recipients/:id`

Returns one recipient with the same shape as the list item.

Recipient list, detail, and update responses include `note: string | null`. Recipient search and transaction search include case-insensitive matching on recipient notes. MCP `search_recipients` uses the same search and includes `note` in each result.

### `PATCH /api/recipients/:id`

Updates the name, note, or both. At least one field is required:

```json
{ "displayName": "Pada Arenas", "note": "Sector 43, Gurugram football turf" }
```

`displayName` must contain 1–200 characters after trimming. `note` accepts a string of at most 500 characters after trimming or `null`. Blank notes become `null`; omitted fields remain unchanged. Name conflicts return `409`. Notes do not affect matching or aliases. Creation still requires a name.

### `POST /api/recipients/:id/aliases`

Request body:

```json
{
  "value": "merchant@upi",
  "aliasType": "AUTO",
  "transfer": false
}
```

`aliasType` may be `UPI_ID`, `CARD_MERCHANT`, `TEXT`, or `AUTO`. Returns:

- `status`: `created`, `already_linked`, or `moved`
- `alias`
- `movedTransactionCount`
- `movedTransactionTotalAmount`
- `deletedSourceRecipient`

If the alias already belongs to another recipient and `transfer` is not set, the route returns `409` with transfer-impact `details`.

If the transfer would merge two recipients that each have an enabled rule, it returns `409` with `code: "RULE_RECIPIENT_CONFLICT"` and the target recipient's `existingRule` details.

### Device Tokens

### `GET /api/device-tokens`

Returns device token records ordered by newest first:

- `uuid`
- `label`
- `tokenPrefix`
- `createdAt`
- `lastUsedAt`
- `revokedAt`

### `POST /api/device-tokens`

Request body:

```json
{ "label": "Phone" }
```

Returns `201` with:

- `token`
- `record`

`record` contains the stored token metadata. The plain token is returned only once.

### `DELETE /api/device-tokens/:id`

Revokes an active token by setting `revokedAt`. Returns `{ "revoked": true }`.

### Imports

### `POST /api/imports/sms`

Does not use the browser session. Accepts `Authorization: Token <plain-token>` or `Authorization: Bearer <plain-token>` and requires `sms:import`.

Request body:

```json
{
  "data": { "message": "..." },
  "metadata": { "location": "Bangalore" }
}
```

Behavior:

- resolves the API token by SHA-256 hash through the shared authentication boundary
- conditionally updates `lastUsedAt` when it is empty or older than ten minutes
- parses the SMS with deterministic templates in `src/common/sms-parser.ts`
- creates a transaction with `source: "SMS"` when parsing succeeds
- creates no transaction when an enabled `IGNORE` rule matches the resolved recipient
- stores a `raw_message` record for parsed, ignored, failed, and unparseable cases

Success response:

```json
{ "message": "Transaction created", "uuid": "..." }
```

When an `IGNORE` rule matches, the route still returns `201`, with no transaction UUID:

```json
{ "message": "Message ignored by rule" }
```

If parsing cannot extract both amount and recipient, the route returns `422` with `"Unable to extract required fields from message"`.
