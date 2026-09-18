import { lookup } from "node:dns/promises";
import { request } from "node:https";
import ipaddr from "ipaddr.js";
import { z } from "zod";
import { OAuthError } from "./schemas";

const metadataSchema = z.object({
  client_id: z.string().max(2048),
  client_name: z.string().trim().min(1).max(200),
  redirect_uris: z.array(z.string().max(2048)).min(1).max(50),
  token_endpoint_auth_method: z.literal("none"),
  grant_types: z.array(z.string().min(1).max(200)).max(20).optional(),
  response_types: z.array(z.string().min(1).max(200)).max(20).optional(),
  client_secret: z.never().optional(),
  client_secret_expires_at: z.never().optional(),
});
export type ClientMetadata = z.infer<typeof metadataSchema>;
const cache = new Map<
  string,
  { metadata: ClientMetadata; expiresAt: number }
>();

export function isPublicAddress(address: string) {
  try {
    const ip = ipaddr.parse(address);
    // Includes mapped IPv4, loopback, link-local, unique-local and transition ranges.
    return ip.range() === "unicast";
  } catch {
    return false;
  }
}

export function clientMetadataUrl(clientId: string) {
  try {
    const url = new URL(clientId);
    const withoutSuffix = clientId.split(/[?#]/)[0];
    const pathStart = withoutSuffix.indexOf("/", 8);
    const rawPath = pathStart < 0 ? "" : withoutSuffix.slice(pathStart);
    if (
      clientId.length > 2048 ||
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.hash ||
      !rawPath ||
      /\s|\\/.test(clientId) ||
      /(?:^|\/)(?:\.|%2e){1,2}(?:\/|$)/i.test(rawPath)
    )
      throw new Error();
    return url;
  } catch {
    throw new OAuthError("invalid_client");
  }
}

export function validRedirect(value: string) {
  try {
    const url = new URL(value);
    return (
      !/\s|\\/.test(value) &&
      !url.username &&
      !url.password &&
      !url.hash &&
      (url.protocol === "https:" ||
        (url.protocol === "http:" &&
          ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))
    );
  } catch {
    return false;
  }
}

export function redirectAllowed(value: string, allowed: string[]) {
  if (!validRedirect(value)) return false;
  return allowed.some((candidate) => {
    if (candidate === value) return true;
    // Remove only the port, preserving exact path/query spelling and all other
    // URI components. URL.href would also normalize dot segments and escapes.
    const loopbackAuthority =
      /^(http:\/\/(?:127\.0\.0\.1|\[::1\]))(?::\d+)?(?=\/|\?|$)/;
    return (
      loopbackAuthority.test(candidate) &&
      loopbackAuthority.test(value) &&
      candidate.replace(loopbackAuthority, "$1") ===
        value.replace(loopbackAuthority, "$1")
    );
  });
}

export function validateMetadata(clientId: string, body: unknown) {
  const parsed = metadataSchema.safeParse(body);
  if (
    !parsed.success ||
    parsed.data.client_id !== clientId ||
    !parsed.data.redirect_uris.every(validRedirect) ||
    (parsed.data.grant_types &&
      !parsed.data.grant_types.includes("authorization_code")) ||
    (parsed.data.response_types && !parsed.data.response_types.includes("code"))
  )
    throw new OAuthError("invalid_client");
  return parsed.data;
}

// The only network path for CIMD. Resolve once, validate every answer, then pin
// that result into TLS's lookup callback. Do not replace this with plain fetch.
async function download(url: URL): Promise<{ body: unknown; ttl: number }> {
  const signal = AbortSignal.timeout(5000);
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const records = await Promise.race([
    lookup(hostname, { all: true }),
    new Promise<never>((_, reject) =>
      signal.addEventListener(
        "abort",
        () => reject(new OAuthError("invalid_client")),
        { once: true },
      ),
    ),
  ]);
  if (
    !records.length ||
    records.some((record) => !isPublicAddress(record.address))
  )
    throw new OAuthError("invalid_client");
  return new Promise((resolve, reject) => {
    const req = request(
      url,
      {
        signal,
        agent: false,
        headers: { accept: "application/json", "accept-encoding": "identity" },
        lookup: (_host, options, callback) => {
          if (options.all) callback(null, records);
          else callback(null, records[0].address, records[0].family);
        },
      },
      (res) => {
        const type = res.headers["content-type"]?.split(";")[0].trim() ?? "";
        if (
          res.statusCode !== 200 ||
          !(
            type === "application/json" ||
            /^application\/[\w.+-]+\+json$/.test(type)
          ) ||
          (res.headers["content-encoding"] &&
            res.headers["content-encoding"] !== "identity")
        ) {
          res.destroy();
          reject(new OAuthError("invalid_client"));
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > 65536) {
            res.destroy();
            reject(new OAuthError("invalid_client"));
          } else chunks.push(chunk);
        });
        res.on("error", () => reject(new OAuthError("invalid_client")));
        res.on("end", () => {
          try {
            const control = res.headers["cache-control"] ?? "";
            const maxAge = control.match(/(?:^|,)\s*max-age\s*=\s*"?(\d+)/i);
            const age = Number(res.headers.age ?? 0);
            const ttl = /no-store|no-cache/i.test(control)
              ? 0
              : Math.max(
                  0,
                  Math.min(
                    300,
                    maxAge
                      ? Number(maxAge[1]) - (Number.isFinite(age) ? age : 0)
                      : 300,
                  ),
                ) * 1000;
            resolve({
              body: JSON.parse(Buffer.concat(chunks).toString("utf8")),
              ttl,
            });
          } catch {
            reject(new OAuthError("invalid_client"));
          }
        });
      },
    );
    req.on("error", () => reject(new OAuthError("invalid_client")));
    req.end();
  });
}

export async function resolveClientMetadata(
  clientId: string,
): Promise<ClientMetadata> {
  const url = clientMetadataUrl(clientId);
  const existing = cache.get(clientId);
  if (existing && existing.expiresAt > Date.now()) return existing.metadata;
  cache.delete(clientId);
  try {
    const { body, ttl } = await download(url);
    const metadata = validateMetadata(clientId, body);
    if (ttl > 0) {
      if (cache.size >= 100) cache.delete(cache.keys().next().value!);
      cache.set(clientId, { metadata, expiresAt: Date.now() + ttl });
    }
    return metadata;
  } catch {
    throw new OAuthError("invalid_client");
  }
}
