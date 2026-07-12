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
- `recipientDisplayName`, optional `recipientRaw`, optional `recipientName`
- `reference`, `accountLabel`, `remarks`, `locationRaw`
- `timestamp`, `createdAt`, `updatedAt`
- `category`, `subcategory`, `categoryUuid`, `subcategoryUuid`

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

`categoryUuid` and `subcategoryUuid` may be `null`. Returns `201` with `{ "uuid": "..." }`.

### `GET /api/transactions/:id`

Returns one transaction DTO with the same fields as the list item plus `recipientRaw` and `recipientName`.

### `PATCH /api/transactions/:id`

Same shape as create, except `recipientUuid` is not accepted. Returns `{ "uuid": "..." }`.

### `PATCH /api/transactions/:id/category`

Request body:

```json
{ "categoryUuid": "...", "subcategoryUuid": "..." }
```

`categoryUuid` may be `null` to clear the category. Returns:

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

The suggestion is based on prior categorized transactions for the same resolved recipient.

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
