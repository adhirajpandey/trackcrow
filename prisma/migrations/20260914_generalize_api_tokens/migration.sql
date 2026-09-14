CREATE TYPE "ApiTokenScope" AS ENUM (
  'transactions:read',
  'transactions:write',
  'sms:import'
);

ALTER TABLE "device_token"
  ADD COLUMN "scopes" "ApiTokenScope"[] NOT NULL
  DEFAULT ARRAY['sms:import']::"ApiTokenScope"[];
