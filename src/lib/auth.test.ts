jest.mock("@/lib/prisma-rewrite", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@/server/modules/users/service", () => ({
  ensureUserBootstrap: jest.fn(),
}));

import prisma from "@/lib/prisma-rewrite";

import { authOptions } from "./auth";

const mockFindUnique = jest.mocked(prisma.user.findUnique);

describe("authOptions callbacks.jwt", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("hydrates the token image from the database when the session token is missing it", async () => {
    mockFindUnique.mockResolvedValue({
      id: 1,
      uuid: "user-uuid",
      email: "user@example.com",
      name: "User Name",
      image: "https://lh3.googleusercontent.com/a/profile-image",
      subscription: 0,
    });

    const jwt = authOptions.callbacks?.jwt;

    await expect(
      jwt?.({
        token: {
          email: "user@example.com",
          image: null,
        },
        user: undefined,
        account: undefined,
        profile: undefined,
        trigger: "update",
        isNewUser: false,
        session: undefined,
      } as never)
    ).resolves.toMatchObject({
      uuid: "user-uuid",
      email: "user@example.com",
      name: "User Name",
      image: "https://lh3.googleusercontent.com/a/profile-image",
    });

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
      select: {
        id: true,
        uuid: true,
        email: true,
        name: true,
        image: true,
        subscription: true,
      },
    });
  });

  it("prefers the current provider image during sign-in when Google returns one", async () => {
    mockFindUnique.mockResolvedValue({
      id: 1,
      uuid: "user-uuid",
      email: "user@example.com",
      name: "User Name",
      image: null,
      subscription: 0,
    });

    const jwt = authOptions.callbacks?.jwt;

    await expect(
      jwt?.({
        token: {},
        user: {
          email: "user@example.com",
          image: "https://lh3.googleusercontent.com/a/new-profile-image",
        },
        account: {
          provider: "google",
          type: "oauth",
          providerAccountId: "provider-account-id",
        },
        profile: undefined,
        trigger: "signIn",
        isNewUser: false,
        session: undefined,
      } as never)
    ).resolves.toMatchObject({
      image: "https://lh3.googleusercontent.com/a/new-profile-image",
    });
  });
});
