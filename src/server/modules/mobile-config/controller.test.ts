import { getMobileConfig } from "./controller";

describe("mobile sender config", () => {
  it("is public and exposes headers without templates or regexes", async () => {
    const response = getMobileConfig(
      new Request("http://localhost/api/mobile/config"),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      schemaVersion: 1,
      configVersion: "1",
      banks: [
        { id: "KOTAK", name: "Kotak", senderHeaders: ["KOTAKB"] },
        { id: "HDFC", name: "HDFC", senderHeaders: ["HDFCBK"] },
      ],
    });
    expect(response.headers.get("cache-control")).toContain("public");
    expect(JSON.stringify(body)).not.toMatch(/regex|templates|keywords/);
  });

  it.each(["exact", "weak", "list", "wildcard"])(
    "returns a bodyless 304 for %s ETags",
    async (kind) => {
      const initial = getMobileConfig(
        new Request("http://localhost/api/mobile/config"),
      );
      const etag = initial.headers.get("etag")!;
      const header =
        kind === "weak"
          ? `W/${etag}`
          : kind === "list"
            ? `"old", ${etag}`
            : kind === "wildcard"
              ? "*"
              : etag;
      const response = getMobileConfig(
        new Request("http://localhost/api/mobile/config", {
          headers: { "If-None-Match": header },
        }),
      );
      expect(response.status).toBe(304);
      expect(await response.text()).toBe("");
      expect(response.headers.get("etag")).toBe(etag);
    },
  );

  it("sends config again for a stale ETag", () => {
    expect(
      getMobileConfig(
        new Request("http://localhost/api/mobile/config", {
          headers: { "If-None-Match": '"old"' },
        }),
      ).status,
    ).toBe(200);
  });
});
