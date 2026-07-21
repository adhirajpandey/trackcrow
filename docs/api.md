# TrackCrow API

This document describes the current HTTP API exposed from `src/app/api/*`.

## Common Behavior

- All `:id` path params in these routes are UUIDs.
- Most routes require a valid NextAuth session and return `401` with `{ "message": "Unauthorized" }` when the session is missing.
- `POST /api/imports/sms` is the session exception. It uses `Authorization: Token <plain-token>`.
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

All success responses are JSON.

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
- `reference`, `accountLabel`, `remarks`, `locationRaw`
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
  "accountLabel": "HDFC",
  "locationRaw": "Bangalore"
}
```

`categoryUuid` and `subcategoryUuid` may be `null`. Manual creation records `classificationSource: "MANUAL"`. Returns `201` with `{ "uuid": "..." }`.

### `GET /api/transactions/:id`

Returns one transaction DTO with the same fields as the list item plus `recipientRaw`, `recipientName`, and `classificationRule`.

`classificationRule` is either `null` or contains `uuid`, `name`, and `isDeleted` for the rule that assigned the current classification.

### `PATCH /api/transactions/:id`

Same shape as create, except `recipientUuid` is not accepted. The optional `classificationIntent: "SUGGESTION"` marks the category change as an accepted suggestion and requires both `categoryUuid` and `subcategoryUuid` to be present. Returns `{ "uuid": "..." }`.

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
- `action` with `categoryUuid`, `categoryName`, `subcategoryUuid`, and `subcategoryName`
- `createdAt`, `updatedAt`

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

Accepts any non-empty subset of `name`, `isEnabled`, `conditions`, and `action` using the same shapes and ownership validation as creation. A `NEEDS_REPAIR` rule cannot be enabled until a valid action is supplied. Returns the updated rule DTO.

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

### `PATCH /api/recipients/:id`

Same body as create. Returns the full recipient DTO.

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

Does not use the browser session. Requires `Authorization: Token <plain-token>`.

Request body:

```json
{
  "data": { "message": "..." },
  "metadata": { "location": "Bangalore" }
}
```

Behavior:

- resolves the device token by SHA-256 hash
- updates `lastUsedAt`
- parses the SMS with deterministic templates in `src/common/sms-parser.ts`
- creates a transaction with `source: "SMS"` when parsing succeeds
- stores a `raw_message` record for parsed, failed, and unparseable cases

Success response:

```json
{ "message": "Transaction created", "uuid": "..." }
```

If parsing cannot extract both amount and recipient, the route returns `422` with `"Unable to extract required fields from message"`.
