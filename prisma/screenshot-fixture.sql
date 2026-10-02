-- Synthetic data for the Android screenshot account. Loaded by `pnpm db:screenshot-reset`.
-- Every name, identifier, reference, and amount is invented. It touches only the user below,
-- so the developer's own local data and the rows from prisma/seed.sql stay unchanged.
-- Transaction times are relative to the current IST day, so Overview and Insights always have
-- current-month activity. Entries later today are moved before now, keeping their order.

BEGIN;

-- Replace the previous fixture, children first: transactions and rules restrict recipient and account deletion.
DELETE FROM "transaction" WHERE user_uuid = '5c7ee75a-0000-4000-8000-000000000001';
DELETE FROM raw_message WHERE user_uuid = '5c7ee75a-0000-4000-8000-000000000001';
DELETE FROM rule WHERE user_uuid = '5c7ee75a-0000-4000-8000-000000000001';
DELETE FROM recipient_identifier WHERE user_uuid = '5c7ee75a-0000-4000-8000-000000000001';
DELETE FROM recipient WHERE user_uuid = '5c7ee75a-0000-4000-8000-000000000001';
DELETE FROM subcategory WHERE user_uuid = '5c7ee75a-0000-4000-8000-000000000001';
DELETE FROM category WHERE user_uuid = '5c7ee75a-0000-4000-8000-000000000001';
DELETE FROM account WHERE user_uuid = '5c7ee75a-0000-4000-8000-000000000001';
DELETE FROM device_token WHERE user_uuid = '5c7ee75a-0000-4000-8000-000000000001';
DELETE FROM oauth_connection WHERE user_uuid = '5c7ee75a-0000-4000-8000-000000000001';
DELETE FROM diagnostic_report WHERE user_uuid = '5c7ee75a-0000-4000-8000-000000000001';

INSERT INTO "user" (uuid, email, name, provider, "updatedAt")
VALUES ('5c7ee75a-0000-4000-8000-000000000001', 'screenshots@trackcrow.invalid', 'Screenshot Demo', 'screenshot-fixture', now() AT TIME ZONE 'UTC')
ON CONFLICT (uuid) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, "updatedAt" = EXCLUDED."updatedAt";

INSERT INTO account (uuid, user_uuid, name, normalized_name)
SELECT gen_random_uuid(), '5c7ee75a-0000-4000-8000-000000000001', name, lower(name)
FROM (VALUES ('Everyday Savings'), ('Rewards Credit Card'), ('Cash')) AS a(name);

INSERT INTO category (uuid, user_uuid, name, "updatedAt")
SELECT gen_random_uuid(), '5c7ee75a-0000-4000-8000-000000000001', name, now() AT TIME ZONE 'UTC'
FROM (VALUES ('Food'), ('Essentials'), ('Transport'), ('Shopping')) AS c(name);

INSERT INTO subcategory (uuid, user_uuid, "categoryId", name, "updatedAt")
SELECT gen_random_uuid(), c.user_uuid, c.id, s.name, now() AT TIME ZONE 'UTC'
FROM (VALUES
  ('Food', 'Breakfast'), ('Food', 'Lunch'), ('Food', 'Dinner'), ('Food', 'Snacks'),
  ('Essentials', 'Household'), ('Essentials', 'Groceries'), ('Essentials', 'Utilities'), ('Essentials', 'Others'),
  ('Transport', 'Cab'), ('Transport', 'Auto'), ('Transport', 'Bike'), ('Transport', 'Others'),
  ('Shopping', 'Apparel'), ('Shopping', 'Gadgets'), ('Shopping', 'Gifts'), ('Shopping', 'Others')
) AS s(category, name)
JOIN category c ON c.user_uuid = '5c7ee75a-0000-4000-8000-000000000001' AND c.name = s.category;

INSERT INTO recipient (uuid, user_uuid, "displayName", normalized_name, note, "updatedAt")
SELECT gen_random_uuid(), '5c7ee75a-0000-4000-8000-000000000001', name, lower(name), note, now() AT TIME ZONE 'UTC'
FROM (VALUES
  ('Juniper Grocers', 'Weekly groceries and household refills.'),
  ('Copper Kettle Cafe', NULL),
  ('Zoomline Cabs', NULL),
  ('Lumen Pharmacy', NULL),
  ('Pixel Pantry Online', NULL),
  ('Riverside Power', 'Monthly electricity bill.'),
  ('Corner Auto Stand', NULL),
  ('Starlight Cinemas', NULL),
  ('Green Bowl Kitchen', NULL),
  ('Hilltop Bakery', NULL),
  ('Threadline Tailors', 'Alterations and stitching.'),
  ('Wallet Top-up', NULL),
  ('Bluebird Books', NULL)
) AS r(name, note);

INSERT INTO recipient_identifier (uuid, user_uuid, recipient_id, kind, value, normalized_value, "updatedAt")
SELECT gen_random_uuid(), r.user_uuid, r.id, i.kind::"RecipientIdentifierKind", i.value, lower(i.value), now() AT TIME ZONE 'UTC'
FROM (VALUES
  ('Juniper Grocers', 'UPI_ID', 'juniper.grocers@okdemo'),
  ('Juniper Grocers', 'TEXT', 'JUNIPER GROCERS'),
  ('Copper Kettle Cafe', 'UPI_ID', 'copperkettle@okdemo'),
  ('Zoomline Cabs', 'UPI_ID', 'zoomline.rides@okdemo'),
  ('Zoomline Cabs', 'TEXT', 'ZOOMLINE MOBILITY'),
  ('Lumen Pharmacy', 'UPI_ID', 'lumen.pharmacy@okdemo'),
  ('Pixel Pantry Online', 'CARD_MERCHANT', 'PIXEL PANTRY ONLINE'),
  ('Starlight Cinemas', 'UPI_ID', 'starlight.tickets@okdemo'),
  ('Green Bowl Kitchen', 'UPI_ID', 'greenbowl@okdemo'),
  ('Hilltop Bakery', 'UPI_ID', 'hilltop.bakery@okdemo'),
  ('Wallet Top-up', 'UPI_ID', 'wallet.topup@okdemo'),
  ('Bluebird Books', 'CARD_MERCHANT', 'BLUEBIRD BOOKS')
) AS i(recipient, kind, value)
JOIN recipient r ON r.user_uuid = '5c7ee75a-0000-4000-8000-000000000001' AND r."displayName" = i.recipient;

-- Enabled, disabled, needs-repair (its category was deleted), and ignore rules.
INSERT INTO rule (uuid, user_uuid, recipient_id, category_id, subcategory_id, name, is_enabled, action_status, action_type, "updatedAt")
SELECT gen_random_uuid(), r.user_uuid, r.id, c.id, s.id, x.name, x.enabled, x.status::"RuleActionStatus", x.action::"RuleActionType",
  (now() AT TIME ZONE 'UTC') - x.age
FROM (VALUES
  ('Juniper groceries', 'Juniper Grocers', 'Essentials', 'Groceries', true, 'VALID', 'CATEGORIZE', interval '40 days'),
  ('Morning coffee', 'Copper Kettle Cafe', 'Food', 'Breakfast', true, 'VALID', 'CATEGORIZE', interval '30 days'),
  ('Skip wallet top-ups', 'Wallet Top-up', NULL, NULL, true, 'VALID', 'IGNORE', interval '20 days'),
  ('Cab rides', 'Zoomline Cabs', 'Transport', 'Cab', false, 'VALID', 'CATEGORIZE', interval '10 days'),
  ('Movie nights', 'Starlight Cinemas', NULL, NULL, false, 'NEEDS_REPAIR', 'CATEGORIZE', interval '5 days')
) AS x(name, recipient, category, subcategory, enabled, status, action, age)
JOIN recipient r ON r.user_uuid = '5c7ee75a-0000-4000-8000-000000000001' AND r."displayName" = x.recipient
LEFT JOIN category c ON c.user_uuid = r.user_uuid AND c.name = x.category
LEFT JOIN subcategory s ON s."categoryId" = c.id AND s.name = x.subcategory;

-- days: IST days before today; at: IST clock time. classified: MANUAL, SUGGESTION, RULE, or NULL (uncategorized).
INSERT INTO "transaction" (
  uuid, user_uuid, recipient_id, category_id, subcategory_id, account_id,
  classification_source, classification_rule_id, classification_changed_at,
  amount, type, source, recipient_raw, recipient_name, reference, remarks, location_raw, "timestamp", "updatedAt"
)
SELECT gen_random_uuid(), r.user_uuid, r.id, c.id, s.id, a.id,
  t.classified::"ClassificationSource", ru.id, CASE WHEN t.classified IS NULL THEN NULL ELSE at.ts AT TIME ZONE 'UTC' END,
  t.amount, t.type::"TransactionType", t.source::"TransactionSource",
  coalesce((SELECT value FROM recipient_identifier WHERE recipient_id = r.id ORDER BY kind LIMIT 1), r."displayName"),
  r."displayName", t.reference, t.remarks, t.location, at.ts, now() AT TIME ZONE 'UTC'
FROM (VALUES
  (0, time '09:05', 'Copper Kettle Cafe', 185, 'UPI', 'SMS', 'Everyday Savings', 'Food', 'Breakfast', 'RULE', 'DEMO-UPI-310901', NULL, NULL),
  (0, time '08:20', 'Lumen Pharmacy', 642, 'UPI', 'SMS', 'Everyday Savings', NULL, NULL, NULL, 'DEMO-UPI-310882', NULL, NULL),
  (0, time '07:45', 'Corner Auto Stand', 90, 'CASH', 'MANUAL', 'Cash', 'Transport', 'Auto', 'MANUAL', NULL, 'Ride to the station', NULL),
  (1, time '20:40', 'Starlight Cinemas', 760, 'UPI', 'SMS', 'Everyday Savings', NULL, NULL, NULL, 'DEMO-UPI-310744', 'Two tickets', NULL),
  (1, time '13:15', 'Green Bowl Kitchen', 320, 'UPI', 'SMS', 'Everyday Savings', 'Food', 'Lunch', 'SUGGESTION', 'DEMO-UPI-310702', NULL, NULL),
  (2, time '18:30', 'Juniper Grocers', 1840, 'UPI', 'SMS', 'Everyday Savings', 'Essentials', 'Groceries', 'RULE', 'DEMO-UPI-310655', NULL, 'Demo Market, Sector 5'),
  (2, time '09:00', 'Copper Kettle Cafe', 160, 'UPI', 'SMS', 'Everyday Savings', 'Food', 'Breakfast', 'RULE', 'DEMO-UPI-310640', NULL, NULL),
  (3, time '22:10', 'Zoomline Cabs', 412, 'UPI', 'SMS', 'Everyday Savings', 'Transport', 'Cab', 'MANUAL', 'DEMO-UPI-310598', NULL, NULL),
  (3, time '16:45', 'Pixel Pantry Online', 2499, 'CARD', 'SMS', 'Rewards Credit Card', 'Shopping', 'Gadgets', 'SUGGESTION', 'DEMO-CARD-88213', 'Phone stand', NULL),
  (4, time '11:20', 'Wallet Top-up', 500, 'UPI', 'SMS', 'Everyday Savings', NULL, NULL, NULL, 'DEMO-UPI-310544', NULL, NULL),
  (5, time '17:05', 'Hilltop Bakery', 240, 'UPI', 'SMS', 'Everyday Savings', 'Food', 'Snacks', 'MANUAL', 'DEMO-UPI-310501', NULL, NULL),
  (6, time '10:30', 'Riverside Power', 1365, 'NETBANKING', 'MANUAL', 'Everyday Savings', 'Essentials', 'Utilities', 'MANUAL', 'DEMO-NB-4410', 'September bill', NULL),
  (7, time '19:25', 'Juniper Grocers', 2210, 'UPI', 'SMS', 'Everyday Savings', 'Essentials', 'Groceries', 'RULE', 'DEMO-UPI-310433', NULL, NULL),
  (8, time '21:15', 'Starlight Cinemas', 540, 'UPI', 'SMS', 'Rewards Credit Card', NULL, NULL, NULL, 'DEMO-UPI-310402', NULL, NULL),
  (9, time '08:55', 'Copper Kettle Cafe', 210, 'UPI', 'SMS', 'Everyday Savings', 'Food', 'Breakfast', 'RULE', 'DEMO-UPI-310377', NULL, NULL),
  (10, time '12:40', 'Threadline Tailors', 1200, 'CASH', 'MANUAL', 'Cash', 'Shopping', 'Apparel', 'MANUAL', NULL, 'Jacket alteration', NULL),
  (12, time '14:10', 'Bluebird Books', 899, 'CARD', 'SMS', 'Rewards Credit Card', 'Shopping', 'Gifts', 'SUGGESTION', 'DEMO-CARD-88102', NULL, NULL),
  (13, time '23:05', 'Zoomline Cabs', 365, 'UPI', 'SMS', 'Everyday Savings', 'Transport', 'Cab', 'MANUAL', 'DEMO-UPI-310290', NULL, NULL),
  (15, time '18:50', 'Juniper Grocers', 1575, 'UPI', 'SMS', 'Everyday Savings', 'Essentials', 'Groceries', 'RULE', 'DEMO-UPI-310241', NULL, NULL),
  (17, time '13:30', 'Green Bowl Kitchen', 295, 'UPI', 'SMS', 'Everyday Savings', 'Food', 'Lunch', 'SUGGESTION', 'DEMO-UPI-310198', NULL, NULL),
  (19, time '09:40', 'Lumen Pharmacy', 318, 'UPI', 'SMS', 'Everyday Savings', 'Essentials', 'Others', 'MANUAL', 'DEMO-UPI-310160', NULL, NULL),
  (21, time '20:20', 'Hilltop Bakery', 180, 'UPI', 'SMS', 'Everyday Savings', 'Food', 'Snacks', 'MANUAL', 'DEMO-UPI-310121', NULL, NULL),
  (23, time '19:00', 'Juniper Grocers', 1960, 'UPI', 'SMS', 'Everyday Savings', 'Essentials', 'Groceries', 'RULE', 'DEMO-UPI-310087', NULL, NULL),
  (26, time '11:15', 'Pixel Pantry Online', 1299, 'CARD', 'SMS', 'Rewards Credit Card', 'Shopping', 'Gadgets', 'SUGGESTION', 'DEMO-CARD-87990', NULL, NULL),
  (28, time '22:35', 'Zoomline Cabs', 448, 'UPI', 'SMS', 'Everyday Savings', 'Transport', 'Cab', 'MANUAL', 'DEMO-UPI-310021', NULL, NULL),
  (31, time '08:50', 'Copper Kettle Cafe', 175, 'UPI', 'SMS', 'Everyday Savings', 'Food', 'Breakfast', 'RULE', 'DEMO-UPI-309980', NULL, NULL),
  (34, time '10:05', 'Riverside Power', 1490, 'NETBANKING', 'MANUAL', 'Everyday Savings', 'Essentials', 'Utilities', 'MANUAL', 'DEMO-NB-4398', 'August bill', NULL),
  (37, time '18:15', 'Juniper Grocers', 2045, 'UPI', 'SMS', 'Everyday Savings', 'Essentials', 'Groceries', 'MANUAL', 'DEMO-UPI-309901', NULL, NULL),
  (41, time '19:45', 'Starlight Cinemas', 620, 'UPI', 'SMS', 'Everyday Savings', 'Shopping', 'Others', 'MANUAL', 'DEMO-UPI-309855', NULL, NULL),
  (45, time '12:55', 'Green Bowl Kitchen', 340, 'UPI', 'SMS', 'Everyday Savings', 'Food', 'Lunch', 'SUGGESTION', 'DEMO-UPI-309812', NULL, NULL),
  (49, time '17:30', 'Corner Auto Stand', 120, 'CASH', 'MANUAL', 'Cash', 'Transport', 'Auto', 'MANUAL', NULL, NULL, NULL),
  (53, time '15:20', 'Threadline Tailors', 2600, 'UPI', 'MANUAL', 'Everyday Savings', 'Shopping', 'Apparel', 'MANUAL', NULL, 'Two shirts stitched', NULL),
  (58, time '18:40', 'Juniper Grocers', 1720, 'UPI', 'SMS', 'Everyday Savings', 'Essentials', 'Groceries', 'MANUAL', 'DEMO-UPI-309701', NULL, NULL),
  (64, time '10:15', 'Riverside Power', 1610, 'NETBANKING', 'MANUAL', 'Everyday Savings', 'Essentials', 'Utilities', 'MANUAL', 'DEMO-NB-4385', 'July bill', NULL),
  (70, time '21:50', 'Zoomline Cabs', 530, 'UPI', 'SMS', 'Everyday Savings', 'Transport', 'Cab', 'MANUAL', 'DEMO-UPI-309612', NULL, NULL),
  (77, time '13:05', 'Bluebird Books', 1150, 'CARD', 'SMS', 'Rewards Credit Card', 'Shopping', 'Gifts', 'MANUAL', 'DEMO-CARD-87711', NULL, NULL),
  (85, time '19:30', 'Juniper Grocers', 1890, 'UPI', 'SMS', 'Everyday Savings', 'Essentials', 'Groceries', 'MANUAL', 'DEMO-UPI-309498', NULL, NULL),
  (96, time '10:20', 'Riverside Power', 1720, 'NETBANKING', 'MANUAL', 'Everyday Savings', 'Essentials', 'Utilities', 'MANUAL', 'DEMO-NB-4371', 'June bill', NULL),
  (110, time '16:10', 'Pixel Pantry Online', 3499, 'CARD', 'SMS', 'Rewards Credit Card', 'Shopping', 'Gadgets', 'MANUAL', 'DEMO-CARD-87502', NULL, NULL),
  (125, time '09:35', 'Copper Kettle Cafe', 150, 'UPI', 'SMS', 'Everyday Savings', 'Food', 'Breakfast', 'MANUAL', 'DEMO-UPI-309277', NULL, NULL),
  (140, time '18:05', 'Juniper Grocers', 1655, 'UPI', 'SMS', 'Everyday Savings', 'Essentials', 'Groceries', 'MANUAL', 'DEMO-UPI-309190', NULL, NULL),
  (160, time '11:45', 'Threadline Tailors', 950, 'CASH', 'MANUAL', 'Cash', 'Shopping', 'Apparel', 'MANUAL', NULL, NULL, NULL)
) AS t(days, at_time, recipient, amount, type, source, account, category, subcategory, classified, reference, remarks, location)
CROSS JOIN LATERAL (
  SELECT least(
    (date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') - make_interval(days => t.days) + t.at_time::interval) AT TIME ZONE 'Asia/Kolkata',
    now() - interval '5 minutes' - (time '23:59' - t.at_time) / 30
  ) AS ts
) AS at
JOIN recipient r ON r.user_uuid = '5c7ee75a-0000-4000-8000-000000000001' AND r."displayName" = t.recipient
JOIN account a ON a.user_uuid = r.user_uuid AND a.name = t.account
LEFT JOIN category c ON c.user_uuid = r.user_uuid AND c.name = t.category
LEFT JOIN subcategory s ON s."categoryId" = c.id AND s.name = t.subcategory
LEFT JOIN rule ru ON t.classified = 'RULE' AND ru.recipient_id = r.id AND ru.deleted_at IS NULL;

COMMIT;
