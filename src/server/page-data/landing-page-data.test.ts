jest.mock("server-only", () => ({}));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

import { getServerSession } from "next-auth";
import { logger } from "@/lib/logger";
import { getLandingPageData } from "./landing-page-data";

const session = jest.mocked(getServerSession);

it.each([null, { user: {} }, { user: { email: "test@example.com" } }])(
  "treats a session without user.uuid as signed out: %j",
  async (value) => {
    session.mockResolvedValueOnce(value);
    expect(await getLandingPageData()).toEqual({ authenticated: false });
  }
);

it("recognizes an authenticated user", async () => {
  session.mockResolvedValueOnce({ user: { uuid: "test-user" } });
  expect(await getLandingPageData()).toEqual({ authenticated: true });
});

it("logs lookup failures and leaves the public landing page available", async () => {
  const error = new Error("session unavailable");
  session.mockRejectedValueOnce(error);
  expect(await getLandingPageData()).toEqual({ authenticated: false });
  expect(logger.error).toHaveBeenCalledWith(
    expect.objectContaining({ event: "auth.landing_session_resolution_failed" }), error
  );
});
