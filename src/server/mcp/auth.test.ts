jest.mock("@/server/modules/api-tokens/service", () => ({
  resolveApiToken: jest.fn(),
}));
jest.mock("@/server/modules/oauth/service", () => ({
  resolveOAuthAccessToken: jest.fn(),
}));
import { resolveApiToken } from "@/server/modules/api-tokens/service";
import { resolveOAuthAccessToken } from "@/server/modules/oauth/service";
import { resolveMcpToken } from "./auth";

it("routes OAuth access tokens and PATs to their separate resolvers", async () => {
  await resolveMcpToken("tc_at_access");
  expect(resolveOAuthAccessToken).toHaveBeenCalledWith("tc_at_access");
  expect(resolveApiToken).not.toHaveBeenCalled();
  await resolveMcpToken("legacy-pat");
  expect(resolveApiToken).toHaveBeenCalledWith("legacy-pat");
});
