# TrackCrow API

This document describes the current HTTP API exposed from `src/app/api/*`.

## Common Behavior

### Authentication

- Most routes require a valid NextAuth session and return `401` with `{ "message": "Unauthorized" }` when the session is missing.
- `POST /api/imports/sms` is the exception. It uses `Authorization: Token <plain-token>` instead of the session cookie.

### Validation And Error Mapping

Controllers validate route params, query params, and JSON bodies with Zod before calling services.

Common error responses:

| Status | Shape | When it is used |
| --- | --- | --- |
| `400` | `{ message: "Invalid request", issues? }` | schema validation failures |
| `400` | `{ message: "Invalid JSON body" }` | malformed JSON |
| `401` | `{ message: "Unauthorized" }` | missing session or invalid import token |
| `404` | `{ message: "Not found" }` | missing user-owned resource |
| `409` | `{ message: "Conflict" }` | uniqueness conflicts |
| `422` | `{ message: "Unprocessable entity", details? }` | service-level unprocessable errors |
| `500` | `{ message: "Internal Server Error" }` | unexpected failures |

All success responses are JSON.

## Routes

### Auth

### `GET|POST /api/auth/[...nextauth]`

NextAuth handler for Google sign-in and session flows.

### User

### `GET /api/me`

Requires a session. Returns the current user DTO:

- `uuid`
- `id`
- `email`
- `name`
- `image`
- `subscription`

### Categories

### `GET /api/categories`

Requires a session. Returns category options shaped for the frontend:

- `id`
- `uuid`
- `name`
- `subcategories[]` with `id`, `uuid`, `name`, `categoryId`

### `POST /api/categories`

Requires a session.

Request body:

```json
{ "name": "Food" }
```

Returns `201` with `{ id, uuid }`.

### `PATCH /api/categories/:id`

Requires a session. Same body as create. Returns `{ id, uuid }`.

### `DELETE /api/categories/:id`

Requires a session. Returns `{ id }`.

### `POST /api/categories/reset-defaults`

Requires a session. Deletes the user's current categories and subcategories, then reseeds defaults. Returns `{ "reset": true }`.

### Subcategories

### `POST /api/subcategories`

Requires a session.

Request body:

```json
{ "name": "Lunch", "categoryId": 1 }
```

Returns `201` with `{ id, uuid }`.

### `PATCH /api/subcategories/:id`

Requires a session. Same body as create. Returns `{ id, uuid }`.

### `DELETE /api/subcategories/:id`

Requires a session. Returns `{ id }`.

### Transactions

### `GET /api/transactions`

Requires a session.

Supported query params:

- `page`
- `size`
- `q`
- `sortBy=amount|timestamp`
- `sortOrder=asc|desc`
- `startDate`
- `endDate`
- repeated `category` params or a comma-separated `categories` param

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

- ids and timestamps
- amount, currency, type, source
- recipient raw name, optional recipient name, resolved recipient display name
- optional reference, account label, remarks, location
- category and subcategory names and ids

### `POST /api/transactions`

Requires a session. Creates a manual transaction and forces `source` to `MANUAL`.

Request body:

```json
{
  "amount": 120,
  "recipientRaw": "merchant@upi",
  "recipientName": "Merchant",
  "categoryId": 1,
  "subcategoryId": 2,
  "type": "UPI",
  "remarks": "Dinner",
  "timestamp": "2026-06-21T10:00:00.000Z",
  "reference": "123",
  "accountLabel": "HDFC",
  "locationRaw": "Bangalore"
}
```

Returns `201` with `{ id, uuid }`.

### `GET /api/transactions/:id`

Requires a session. Returns one transaction DTO.

### `PATCH /api/transactions/:id`

Requires a session. Same body shape as create. Returns `{ id }`.

### `PATCH /api/transactions/:id/category`

Requires a session.

Request body:

```json
{ "categoryId": 9 }
```

`categoryId` may also be `null` to clear the category. When the category changes or is cleared, the service clears `subcategoryId`.

Returns:

- `id`
- `categoryId`
- `category`
- `subcategoryId`
- `subcategory`

### `DELETE /api/transactions/:id`

Requires a session. Returns `{ id }`.

### `GET /api/transactions/:id/suggest`

Requires a session. Looks at prior categorized transactions for the same resolved recipient and returns:

- `suggestedCategory`
- `suggestedSubCategory`

### Dashboard

### `GET /api/dashboard/summary`

Requires a session.

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

Requires a session. Optional `startDate` and `endDate`.

Returns an array of:

- `category`
- `totalSpend`
- `transactionCount`

Transactions without a category are grouped under `"Uncategorized"`.

### `GET /api/dashboard/spending-by-period`

Requires a session.

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

Requires a session. Returns all resolved recipients for the user with identifiers and transaction counts.

### `GET /api/recipients/:id`

Requires a session. Returns one recipient with the same shape as the list item.

### Device Tokens

### `GET /api/device-tokens`

Requires a session. Returns device token records ordered by newest first:

- `id`
- `uuid`
- `label`
- `tokenPrefix`
- `createdAt`
- `lastUsedAt`
- `revokedAt`

### `POST /api/device-tokens`

Requires a session.

Request body:

```json
{ "label": "Phone" }
```

Returns `201` with:

- `token`: the only time the plain token is returned
- `record`: the stored token metadata

Only the hash and prefix are stored in the database.

### `DELETE /api/device-tokens/:id`

Requires a session. Revokes an active token by setting `revokedAt`. Returns `{ "revoked": true }`.

### Imports

### `POST /api/imports/sms`

Does not use the session. Requires `Authorization: Token <plain-token>`.

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
- parses the message with deterministic SMS templates in `src/common/sms-parser.ts`
- creates a transaction with `source: "SMS"` when parsing succeeds
- stores a `raw_message` record for parsed, failed, and unparseable cases

Success response:

```json
{ "message": "Transaction created", "id": 1, "uuid": "..." }
```

If parsing cannot extract both amount and recipient, the route returns `422` with a message of `"Unable to extract required fields from message"`.
