import { McpServer, type StandardSchemaWithJSON, type ToolAnnotations } from "@modelcontextprotocol/server";

import { ApiTokenScope, TransactionSource } from "@/generated/prisma-rewrite";
import { logger } from "@/lib/logger";
import { hasApiTokenScope } from "@/server/modules/api-tokens/service";
import type { AuthenticatedToken } from "@/server/modules/api-tokens/types";
import { listCategoriesForUser } from "@/server/modules/categories/service";
import { getDashboardSummary, getSpendingByCategory, getSpendingByPeriod } from "@/server/modules/dashboard/service";
import { listRecipients } from "@/server/modules/recipients/service";
import { createTransaction, listTransactions, updateTransactionCategory } from "@/server/modules/transactions/service";

import {
  categorizeTransactionInput,
  categorizeTransactionOutput,
  createTransactionInput,
  createTransactionOutput,
  listCategoriesInput,
  listCategoriesOutput,
  searchRecipientsInput,
  searchRecipientsOutput,
  searchTransactionsInput,
  searchTransactionsOutput,
  spendingSummaryInput,
  spendingSummaryOutput,
  toIstDateRange,
} from "./schemas";

function success<T extends Record<string, unknown>>(data: T) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }], structuredContent: data };
}

function failure(message: string) {
  return { isError: true as const, content: [{ type: "text" as const, text: message }] };
}

function registerTool<T>(input: {
  server: McpServer;
  identity: AuthenticatedToken;
  name: string;
  scope: ApiTokenScope;
  config: {
    title?: string;
    description?: string;
    inputSchema: StandardSchemaWithJSON;
    outputSchema: StandardSchemaWithJSON;
    annotations?: ToolAnnotations;
  };
  handler: (args: T) => Promise<ReturnType<typeof success> | ReturnType<typeof failure>>;
}) {
  input.server.registerTool(input.name, input.config, async (args) => {
    const startedAt = Date.now();
    let outcome = "success";
    try {
      if (!hasApiTokenScope(input.identity, input.scope)) {
        outcome = "forbidden";
        return failure("This token does not have the required permission.");
      }
      const result = await input.handler(args as T);
      if ("isError" in result) outcome = "error";
      return result;
    } catch (error) {
      outcome = "error";
      logger.error({
        event: "mcp.tool.failed",
        tokenUuid: input.identity.tokenUuid,
        userId: input.identity.userUuid,
        toolName: input.name,
      }, error);
      return failure("The tool could not complete the request.");
    } finally {
      logger.info({
        event: "mcp.tool.completed",
        tokenUuid: input.identity.tokenUuid,
        userId: input.identity.userUuid,
        toolName: input.name,
        outcome,
        durationMs: Date.now() - startedAt,
      });
    }
  });
}

export function createTrackCrowMcpServer(identity: AuthenticatedToken) {
  const server = new McpServer({ name: "trackcrow", version: "1.0.0" }, { capabilities: { tools: {} } });

  registerTool({ server, identity, name: "search_transactions", scope: ApiTokenScope.TRANSACTIONS_READ,
    config: { title: "Search transactions", description: "Search your TrackCrow transactions.", inputSchema: searchTransactionsInput, outputSchema: searchTransactionsOutput, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } },
    handler: async (args: typeof searchTransactionsInput._output) => {
      const dates = args.startDate && args.endDate ? toIstDateRange(args.startDate, args.endDate) : {
        ...(args.startDate ? { startDate: toIstDateRange(args.startDate, args.startDate).startDate } : {}),
        ...(args.endDate ? { endDate: toIstDateRange(args.endDate, args.endDate).endDate } : {}),
      };
      const result = await listTransactions({ userUuid: identity.userUuid, page: args.page, size: args.limit, q: args.query, categories: args.uncategorized ? ["uncategorized"] : args.categories, subcategories: args.subcategories, classificationSources: args.classificationSources, sortBy: args.sortBy, sortOrder: args.sortOrder, ...dates });
      if (!result.ok) return failure("Transactions are temporarily unavailable.");
      const transactions = result.data.transactions.map((item) => ({
        uuid: item.uuid,
        amount: item.amount,
        currency: item.currency,
        type: item.type,
        source: item.source,
        recipientUuid: item.recipientUuid,
        recipientDisplayName: item.recipientDisplayName,
        reference: item.reference,
        accountLabel: item.accountLabel,
        remarks: item.remarks,
        locationRaw: item.locationRaw,
        timestamp: item.timestamp,
        category: item.category,
        subcategory: item.subcategory,
        categoryUuid: item.categoryUuid,
        subcategoryUuid: item.subcategoryUuid,
        classificationSource: item.classificationSource,
      }));
      return success({ transactions, pagination: { page: result.data.page, limit: result.data.pageSize, total: result.data.total, totalPages: result.data.totalPages, hasNext: result.data.hasNext, hasPrev: result.data.hasPrev } });
    } });

  registerTool({ server, identity, name: "get_spending_summary", scope: ApiTokenScope.TRANSACTIONS_READ,
    config: { title: "Get spending summary", description: "Summarize spending over inclusive Asia/Kolkata dates.", inputSchema: spendingSummaryInput, outputSchema: spendingSummaryOutput, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } },
    handler: async (args: typeof spendingSummaryInput._output) => {
      const range = { userUuid: identity.userUuid, ...toIstDateRange(args.startDate, args.endDate) };
      const summary = await getDashboardSummary(range);
      if (!summary.ok) return failure("The spending summary is temporarily unavailable.");
      if (args.grouping === "category") {
        const breakdown = await getSpendingByCategory(range);
        return breakdown.ok ? success({ summary: summary.data, grouping: args.grouping, breakdown: breakdown.data }) : failure("The spending summary is temporarily unavailable.");
      }
      if (args.grouping === "period") {
        const breakdown = await getSpendingByPeriod({ ...range, granularity: args.periodGranularity });
        return breakdown.ok ? success({ summary: summary.data, grouping: args.grouping, breakdown: breakdown.data }) : failure("The spending summary is temporarily unavailable.");
      }
      return success({ summary: summary.data, grouping: args.grouping, breakdown: [] });
    } });

  registerTool({ server, identity, name: "list_categories", scope: ApiTokenScope.TRANSACTIONS_READ,
    config: { title: "List categories", description: "List category and subcategory names and UUIDs.", inputSchema: listCategoriesInput, outputSchema: listCategoriesOutput, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } },
    handler: async () => { const result = await listCategoriesForUser({ userUuid: identity.userUuid }); return result.ok ? success({ categories: result.data }) : failure("Categories are temporarily unavailable."); } });

  registerTool({ server, identity, name: "search_recipients", scope: ApiTokenScope.TRANSACTIONS_READ,
    config: { title: "Search recipients", description: "Find existing recipients for transaction creation.", inputSchema: searchRecipientsInput, outputSchema: searchRecipientsOutput, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } },
    handler: async (args: typeof searchRecipientsInput._output) => {
      const result = await listRecipients({ userUuid: identity.userUuid, q: args.query, page: args.page, size: args.limit });
      if (!result.ok) return failure("Recipients are temporarily unavailable.");
      return success({ recipients: result.data.recipients.map((recipient) => ({ uuid: recipient.uuid, name: recipient.displayName, aliases: recipient.aliases.map((alias) => ({ uuid: alias.uuid, type: alias.aliasType, value: alias.value })), transactionCount: recipient.transactionCount, totalAmount: recipient.totalAmount })), pagination: { page: result.data.page, limit: result.data.pageSize, total: result.data.total, totalPages: result.data.totalPages, hasNext: result.data.hasNext, hasPrev: result.data.hasPrev } });
    } });

  registerTool({ server, identity, name: "create_transaction", scope: ApiTokenScope.TRANSACTIONS_WRITE,
    config: { title: "Create transaction", description: "Create a non-idempotent manual INR transaction for an existing recipient. Do not retry after an uncertain result because duplicates are possible.", inputSchema: createTransactionInput, outputSchema: createTransactionOutput, annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false } },
    handler: async (args: typeof createTransactionInput._output) => {
      const input = { userUuid: identity.userUuid, amount: args.amount, recipientUuid: args.recipientUuid, type: args.type, timestamp: new Date(args.timestamp), source: TransactionSource.MANUAL,
        ...(Object.prototype.hasOwnProperty.call(args, "categoryUuid") ? { categoryUuid: args.categoryUuid } : {}),
        ...(Object.prototype.hasOwnProperty.call(args, "subcategoryUuid") ? { subcategoryUuid: args.subcategoryUuid } : {}),
        ...(Object.prototype.hasOwnProperty.call(args, "remarks") ? { remarks: args.remarks } : {}),
        ...(Object.prototype.hasOwnProperty.call(args, "reference") ? { reference: args.reference } : {}),
        ...(Object.prototype.hasOwnProperty.call(args, "accountLabel") ? { accountLabel: args.accountLabel } : {}),
        ...(Object.prototype.hasOwnProperty.call(args, "locationRaw") ? { locationRaw: args.locationRaw } : {}), };
      const result = await createTransaction(input);
      if (!result.ok) return failure(result.error === "VALIDATION_ERROR" ? "The recipient or classification does not exist." : "The transaction could not be created.");
      return success(result.data);
    } });

  registerTool({ server, identity, name: "categorize_transaction", scope: ApiTokenScope.TRANSACTIONS_WRITE,
    config: { title: "Categorize transaction", description: "Set or clear a transaction category.", inputSchema: categorizeTransactionInput, outputSchema: categorizeTransactionOutput, annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false } },
    handler: async (args: typeof categorizeTransactionInput._output) => {
      const result = await updateTransactionCategory({ userUuid: identity.userUuid, transactionUuid: args.transactionUuid, categoryUuid: args.categoryUuid, ...(Object.prototype.hasOwnProperty.call(args, "subcategoryUuid") ? { subcategoryUuid: args.subcategoryUuid } : {}) });
      if (!result.ok) return failure(result.error === "NOT_FOUND" ? "Transaction not found." : result.error === "VALIDATION_ERROR" ? "The category selection is invalid." : "The transaction could not be categorized.");
      return success(result.data);
    } });

  return server;
}
