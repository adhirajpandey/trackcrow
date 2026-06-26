# TrackCrow Data Model

This document describes the Prisma schema and the business rules enforced around it.

## Core Entities

### User

`User` is the root owner for all user data.

- primary stable key for app ownership: `uuid`
- numeric `id` also exists and is unique
- one user owns categories, subcategories, recipients, transactions, raw messages, and device tokens
- sign-in identity is keyed by unique `email`

### Category And Subcategory

`Category` and `Subcategory` define the spending taxonomy.

- categories are unique per user by `(userUuid, name)`
- subcategories are unique inside a category by `(categoryId, name)`
- categories and subcategories are seeded for new users on first login
- resetting defaults deletes all existing user categories and subcategories before reseeding

Current seeded defaults:

- Food
- Essentials
- Transport
- Shopping

### Recipient And RecipientIdentifier

Recipients normalize transaction counterparties.

- `Recipient` stores a user-owned display name and normalized name
- `RecipientIdentifier` stores raw identifiers such as UPI ids, phone numbers, card merchants, or free text
- identifiers are unique per user by `(userUuid, kind, normalizedValue)`
- transactions always point to a resolved recipient

Service behavior:

- incoming `recipientRaw` is normalized
- the service first tries to match an existing identifier
- if no identifier matches, it tries a normalized recipient name
- if neither exists, it creates a new recipient and identifier

### Transaction

`Transaction` is the main domain entity.

- each transaction belongs to one user and one recipient
- category and subcategory are optional
- `currency` defaults to `INR`
- `type` is one of `UPI`, `CARD`, `CASH`, `NETBANKING`, `OTHER`
- `source` is either `SMS` or `MANUAL`
- `timestamp` is stored as `Timestamptz`

Important service rules:

- manual API creation always forces `source` to `MANUAL`
- SMS import creation sets `source` to `SMS`
- category and subcategory assignments are checked for user ownership
- changing a transaction category through the narrow category endpoint clears the subcategory when the category changes or becomes `null`
- duplicate transactions are allowed

### RawMessage

`RawMessage` stores the original SMS import record.

- belongs to one user
- may optionally link to the created transaction
- stores parser status, parser metadata, parsed payload, and optional location
- `parseStatus` is `PARSED`, `UNPARSEABLE`, or `FAILED`

Service behavior:

- successful imports create a `PARSED` raw message linked to the new transaction
- imports that cannot extract required fields create an `UNPARSEABLE` raw message
- imports whose parsed result fails later transaction creation create a `FAILED` raw message

Raw messages are not deleted automatically when transactions are created.

### DeviceToken

`DeviceToken` authorizes SMS import clients.

- belongs to one user
- only a SHA-256 `tokenHash` and short `tokenPrefix` are stored
- the plain token is generated once and returned only at creation time
- `revokedAt` marks tokens as inactive
- `lastUsedAt` is updated on successful token authentication

## Relationship Summary

```txt
User
  |- Category
  |   `- Subcategory
  |- Recipient
  |   `- RecipientIdentifier
  |- Transaction -> Recipient
  |              -> Category?
  |              -> Subcategory?
  |- RawMessage -> Transaction?
  `- DeviceToken
```

## Delete Behavior

- deleting a user cascades to categories, subcategories, recipients, transactions, raw messages, and device tokens
- deleting a category sets `transaction.categoryId` to `null`
- deleting a subcategory sets `transaction.subcategoryId` to `null`
- deleting a transaction sets `raw_message.transactionId` to `null`
- transactions cannot cascade-delete recipients because the relation uses `onDelete: Restrict`
