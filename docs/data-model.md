# TrackCrow Data Model

This document describes the Prisma schema and the business rules enforced around it.

## Core Entities

### User

`User` is the root owner for all user data.

- primary stable key for app ownership: `uuid`
- numeric `id` also exists and is unique
- one user owns categories, subcategories, recipients, rules, transactions, raw messages, and device tokens
- sign-in identity is keyed by unique `email`

### Category And Subcategory

`Category` and `Subcategory` define the spending taxonomy.

- categories are unique per user by `(userUuid, name)`
- subcategories are unique inside a category by `(categoryId, name)`
- `Subcategory` also carries `userUuid` for ownership checks and cascade cleanup
- categories and subcategories are seeded for new users on first login
- resetting defaults deletes all existing user categories and subcategories before reseeding

### Recipient And RecipientIdentifier

Recipients normalize transaction counterparties.

- `Recipient` stores a user-owned display name, normalized name, and optional `note`. Notes are trimmed, limited to 500 characters by the API, and stored as `null` when cleared. Notes provide personal context and are searchable, but never participate in recipient matching or alias resolution. They are separate from transaction remarks.
- `RecipientIdentifier` stores raw identifiers such as UPI ids, phone numbers, card merchants, or free text
- identifiers are unique per user by `(userUuid, kind, normalizedValue)`
- identifier kinds are `UPI_ID`, `CARD_MERCHANT`, and `TEXT`
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
- account is optional and references a user-owned `Account`
- `currency` defaults to `INR`
- `type` is one of `UPI`, `CARD`, `CASH`, `NETBANKING`, `OTHER`
- `source` is either `SMS` or `MANUAL`
- `timestamp` is stored as `Timestamptz`
- `recipientRaw` stores the original counterparty string from the source event
- `recipientName` is optional source-provided display text
- `classificationSource` records whether the current category assignment came from `MANUAL`, `SUGGESTION`, or `RULE`; it is `null` when no classification has been assigned
- `classificationChangedAt` records when the current classification was applied
- `classificationRuleId` links rule-classified transactions to the originating rule

Important service rules:

- manual API creation always forces `source` to `MANUAL`
- SMS import creation sets `source` to `SMS`
- manual creation records `classificationSource: MANUAL`, including when the transaction is left uncategorized
- imported transactions are classified by the single enabled, valid rule matching their resolved recipient; imports without a match remain unclassified
- an SMS import that matches an enabled `IGNORE` rule creates no transaction at all; only an `IGNORED` raw message is stored
- manual and MCP creation never honor `IGNORE` rules; a deliberately entered transaction is always persisted, uncategorized when an `IGNORE` rule matches
- accepting a current recipient-history suggestion records `classificationSource: SUGGESTION`; direct category edits record `MANUAL`
- changing a transaction classification clears any prior `classificationRuleId`
- transaction create and update APIs use UUID references for recipient, account, category, and subcategory inputs
- account, category, and subcategory assignments are checked for user ownership
- changing a transaction category through the narrow category endpoint can update both category and subcategory, and clearing the category clears the subcategory as well
- duplicate transactions are allowed

### Account

`Account` is a short user-managed list for identifying where a payment occurred. It contains a display `name` and a normalized name used for per-user uniqueness. Normalization trims the name, collapses whitespace, and lowercases it. It does not remove punctuation, numbers, or words.

SMS parsers keep returning their existing account text. Import matches that text against normalized account names for the authenticated user. A unique exact normalized match links the transaction. Missing or unmatched names leave the account empty. Imports never create accounts.

### Rule

`Rule` decides what happens to future imported transactions for one resolved recipient: it either assigns a category and optional subcategory, or ignores the import.

- each rule belongs to one user and one recipient
- the current condition shape is a recipient UUID equality match
- `actionType` is `CATEGORIZE` or `IGNORE`, and defaults to `CATEGORIZE`
- a `CATEGORIZE` action requires a category and may include a subcategory from that category
- an `IGNORE` action carries no category or subcategory, and the `rule_ignore_no_category_check` constraint enforces that
- `isEnabled` controls whether the rule participates in classification
- `actionStatus` is `VALID` or `NEEDS_REPAIR`
- an enabled rule must be valid, and `rule_enabled_action_check` requires either a `CATEGORIZE` action with a category or an `IGNORE` action without one
- at most one non-deleted enabled rule may exist for a user and recipient
- deletion is soft: the service disables the rule and sets `deletedAt`

Rules affect newly imported transactions only. Creating, editing, disabling, repairing, or deleting a rule does not reclassify existing transactions. A transaction assigned by a rule retains its rule relationship after soft deletion so detail responses can expose the historical rule as deleted.

Cross-domain behavior:

- deleting or resetting a category marks affected transaction classifications as manual, clears their rule link, and disables affected rules as `NEEDS_REPAIR`
- deleting a subcategory, or moving it to another category, clears it from affected transactions and disables affected rules as `NEEDS_REPAIR`
- repairing a rule with a valid action returns it to `VALID`; it must still be explicitly enabled if it was disabled
- when an alias transfer removes its source recipient, that recipient's rules move to the target recipient
- a recipient merge is rejected when moving the rules would produce two enabled rules for the target recipient

### RawMessage

`RawMessage` stores the original SMS import record.

- belongs to one user
- may optionally link to the created transaction
- stores parser status, parser metadata, parsed payload, and optional location
- `parseStatus` is `PARSED`, `UNPARSEABLE`, `FAILED`, or `IGNORED`

Service behavior:

- successful imports create a `PARSED` raw message linked to the new transaction
- imports that cannot extract required fields create an `UNPARSEABLE` raw message
- imports whose parsed result fails later transaction creation create a `FAILED` raw message
- imports matched by an enabled `IGNORE` rule create an `IGNORED` raw message with no transaction link and no failure reason; the matching rule UUID is recorded in `parsedPayload.ignoredByRuleUuid`

Raw messages are not deleted automatically when transactions are created.

### ApiToken

`ApiToken` authorizes MCP and SMS clients. Prisma maps it to the existing `device_token` table.

- belongs to one user
- only a SHA-256 `tokenHash` and short `tokenPrefix` are stored
- the plain token is generated once and returned only at creation time
- `scopes` is a nonempty immutable selection of `transactions:read`, `transactions:write`, and `sms:import`
- migrated and legacy-created tokens have only `sms:import`; the database retains that default for older app versions
- `revokedAt` marks tokens as inactive
- `lastUsedAt` is conditionally updated after successful authentication when empty or older than ten minutes

### RateLimitBucket

`RateLimitBucket` stores one fixed-window counter row per opaque bucket key. It contains the count, window start, and expiry. The PostgreSQL adapter resets and increments the row atomically and deletes a bounded batch of old rows during consumption.

## Relationship Summary

```txt
User
  |- Category
  |   `- Subcategory
  |- Recipient
  |   |- RecipientIdentifier
  |   `- Rule -> Category?
  |           -> Subcategory?
  |- Account
  |- Transaction -> Recipient
  |              -> Account?
  |              -> Category?
  |              -> Subcategory?
  |              -> Rule?
  |- RawMessage -> Transaction?
  |- ApiToken
  `- RateLimitBucket (not user-owned; opaque request-protection key)
```

## Seeded Defaults

The current bootstrap seed creates these top-level categories:

- Food
- Essentials
- Transport
- Shopping

## Delete Behavior

OAuth persistence consists of `OAuthConnection`, `OAuthAuthorizationCode`, `OAuthAccessToken`, and `OAuthRefreshToken`, mapped to `oauth_*` tables. Connections belong to a user and snapshot the client ID/name, approved transaction scopes, resource, creation, last-use, revocation, and fixed 90-day expiry. Only successful access-token authentication updates last use, throttled to once every ten minutes.

Codes store a unique credential hash and consent nonce, callback, PKCE challenge, approved scopes, expiry, and consumption time. Access tokens have independent UUIDs and hashed credentials. Refresh tokens store hashed credentials, effective scopes, consumption time, and a unique self-referencing `replacedByTokenUuid` successor. All records reference their connection. Only hashes are stored; token scope narrowing does not rewrite the connection's original grant.

Refresh rotation does not change connection expiry. Consumed refresh records remain available through that deadline for replay detection. Revocation is recorded on the connection and checked for all its credentials, so individual token rows need no separate revocation flag. User deletion cascades through connections to all OAuth credentials.

- deleting a user cascades to categories, subcategories, recipients, rules, transactions, raw messages, and API tokens
- deleting a category sets `transaction.categoryId` to `null`
- deleting a subcategory sets `transaction.subcategoryId` to `null`
- deleting a category or subcategory disables affected rules and marks them `NEEDS_REPAIR`
- deleting a rule is a soft delete; deleting its user cascades the persisted rule record
- deleting a transaction sets `raw_message.transactionId` to `null`
- transactions cannot cascade-delete recipients because the relation uses `onDelete: Restrict`
