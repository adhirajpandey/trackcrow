import { createHash } from "node:crypto";
import {
  smsBanks,
  SMS_CONFIG_VERSION,
  SMS_SCHEMA_VERSION,
} from "@/common/sms-templates";

export function getSenderConfig() {
  const config = {
    schemaVersion: SMS_SCHEMA_VERSION,
    configVersion: SMS_CONFIG_VERSION,
    banks: smsBanks.map(({ id, name, senderHeaders }) => ({
      id,
      name,
      senderHeaders,
    })),
  };
  const body = JSON.stringify(config);
  const etag = `"${createHash("sha256").update(body).digest("hex")}"`;
  return { body, etag };
}
