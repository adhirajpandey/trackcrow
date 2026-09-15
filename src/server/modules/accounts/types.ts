import type { ServiceResult } from "@/server/shared/result";

export type AccountDto = { uuid: string; name: string };

export type AccountWriteInput = {
  userUuid: string;
  name: string;
};

export type AccountUpdateInput = AccountWriteInput & {
  accountUuid: string;
};

export type AccountWriteResult = ServiceResult<
  AccountDto,
  "NOT_FOUND" | "CONFLICT" | "INTERNAL_ERROR"
>;
