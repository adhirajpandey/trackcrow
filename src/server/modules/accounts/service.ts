import prisma from "@/lib/prisma-rewrite";
import { logger } from "@/lib/logger";
import { fail, ok, type ServiceResult } from "@/server/shared/result";

import { cleanAccountName, normalizeAccountName } from "./normalize";
import type { AccountDto, AccountUpdateInput, AccountWriteInput, AccountWriteResult } from "./types";

const accountSelect = { uuid: true, name: true } as const;

export async function listAccounts(input: { userUuid: string }): Promise<ServiceResult<AccountDto[], "INTERNAL_ERROR">> {
  try {
    const accounts = await prisma.account.findMany({
      where: { userUuid: input.userUuid },
      select: accountSelect,
      orderBy: [{ name: "asc" }, { uuid: "asc" }],
    });
    return ok(accounts);
  } catch (error) {
    logger.error({ event: "account.list.db_failed", userId: input.userUuid }, error);
    return fail("INTERNAL_ERROR");
  }
}

export async function createAccount(input: AccountWriteInput): Promise<AccountWriteResult> {
  const name = cleanAccountName(input.name);
  try {
    const account = await prisma.account.create({
      data: { userUuid: input.userUuid, name, normalizedName: normalizeAccountName(name) },
      select: accountSelect,
    });
    return ok(account);
  } catch (error: any) {
    if (error?.code === "P2002") return fail("CONFLICT");
    logger.error({ event: "account.create.db_failed", userId: input.userUuid }, error);
    return fail("INTERNAL_ERROR");
  }
}

export async function updateAccount(input: AccountUpdateInput): Promise<AccountWriteResult> {
  const name = cleanAccountName(input.name);
  try {
    const existing = await prisma.account.findFirst({
      where: { uuid: input.accountUuid, userUuid: input.userUuid },
      select: { id: true },
    });
    if (!existing) return fail("NOT_FOUND");

    const account = await prisma.account.update({
      where: { id: existing.id },
      data: { name, normalizedName: normalizeAccountName(name) },
      select: accountSelect,
    });
    return ok(account);
  } catch (error: any) {
    if (error?.code === "P2002") return fail("CONFLICT");
    logger.error({ event: "account.update.db_failed", userId: input.userUuid, accountUuid: input.accountUuid }, error);
    return fail("INTERNAL_ERROR");
  }
}

export async function resolveAccountId(input: { userUuid: string; accountUuid: string | null | undefined }) {
  if (!input.accountUuid) return ok({ accountId: null });
  try {
    const account = await prisma.account.findFirst({
      where: { uuid: input.accountUuid, userUuid: input.userUuid },
      select: { id: true },
    });
    return account ? ok({ accountId: account.id }) : fail("VALIDATION_ERROR" as const);
  } catch (error) {
    logger.error({ event: "account.resolve.db_failed", userId: input.userUuid }, error);
    return fail("INTERNAL_ERROR" as const);
  }
}

export async function matchAccountByName(input: { userUuid: string; name: string | null | undefined }) {
  if (!input.name?.trim()) return ok({ accountUuid: null });
  try {
    const matches = await prisma.account.findMany({
      where: { userUuid: input.userUuid, normalizedName: normalizeAccountName(input.name) },
      select: { uuid: true },
      take: 2,
    });
    return ok({ accountUuid: matches.length === 1 ? matches[0].uuid : null });
  } catch (error) {
    logger.error({ event: "account.match.db_failed", userId: input.userUuid }, error);
    return fail("INTERNAL_ERROR" as const);
  }
}
