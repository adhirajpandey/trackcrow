import { z } from "zod";
import prisma from "@/lib/prisma";
import { validateSession } from "@/common/server";
import { tool as createTool } from "ai";

/* ----------------------------- ZOD SCHEMA ----------------------------- */
const expenseComparisonSchema = z.object({
  comparisonKeyword1: z.string().min(1, "First keyword required"),
  comparisonKeyword2: z.string().min(1, "Second keyword required"),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
});

/* ----------------------------- TOOL EXECUTION ----------------------------- */
export async function runExpenseComparison(input: any) {
  const structured = "structured_data" in input ? input.structured_data : input;
  const parsed = expenseComparisonSchema.parse(structured);
  const { comparisonKeyword1, comparisonKeyword2, startDate, endDate } = parsed;

  const sessionResult = await validateSession();
  if (!sessionResult.success)
    return { error: sessionResult.error || "User not authenticated." };
  const { userUuid } = sessionResult;

  const start = startDate ? new Date(startDate) : undefined;
  const end = endDate ? new Date(endDate) : undefined;

  try {
    const [cat1, cat2, sub1, sub2, remark1, remark2] = await Promise.all([
      prisma.category.findFirst({
        where: {
          user_uuid: userUuid,
          name: { equals: comparisonKeyword1, mode: "insensitive" },
        },
        select: { id: true, name: true },
      }),
      prisma.category.findFirst({
        where: {
          user_uuid: userUuid,
          name: { equals: comparisonKeyword2, mode: "insensitive" },
        },
        select: { id: true, name: true },
      }),
      prisma.subcategory.findFirst({
        where: {
          user_uuid: userUuid,
          name: { equals: comparisonKeyword1, mode: "insensitive" },
        },
        select: { id: true, name: true, categoryId: true },
      }),
      prisma.subcategory.findFirst({
        where: {
          user_uuid: userUuid,
          name: { equals: comparisonKeyword2, mode: "insensitive" },
        },
        select: { id: true, name: true, categoryId: true },
      }),
      prisma.transaction.findFirst({
        where: {
          user_uuid: userUuid,
          remarks: { equals: comparisonKeyword1, mode: "insensitive" },
        },
        select: { remarks: true },
      }),
      prisma.transaction.findFirst({
        where: {
          user_uuid: userUuid,
          remarks: { equals: comparisonKeyword2, mode: "insensitive" },
        },
        select: { remarks: true },
      }),
    ]);

    const type1 = cat1
      ? "category"
      : sub1
        ? "subcategory"
        : remark1
          ? "remark"
          : "unknown";
    const type2 = cat2
      ? "category"
      : sub2
        ? "subcategory"
        : remark2
          ? "remark"
          : "unknown";

    if (type1 === "unknown" && type2 === "unknown") {
      return {
        message: `❌ Neither "${comparisonKeyword1}" nor "${comparisonKeyword2}" matched any category, subcategory, or remark.`,
        results: [],
      };
    }

    const dateCondition =
      start && end
        ? { gte: start, lte: end }
        : start
          ? { gte: start }
          : end
            ? { lte: end }
            : undefined;

    const buildFilter = async (type: string, entity: any) => {
      if (!entity) return null;

      const filter: any = { user_uuid: userUuid };
      if (dateCondition) filter.timestamp = dateCondition;

      switch (type) {
        case "category": {
          const subIds = (
            await prisma.subcategory.findMany({
              where: { user_uuid: userUuid, categoryId: entity.id },
              select: { id: true },
            })
          ).map((s) => s.id);

          filter.OR = [
            { categoryId: entity.id },
            ...(subIds.length > 0 ? [{ subcategoryId: { in: subIds } }] : []),
          ];
          break;
        }

        case "subcategory":
          filter.subcategoryId = entity.id;
          break;

        case "remark":
          filter.remarks = { equals: entity.remarks, mode: "insensitive" };
          break;

        default:
          return null;
      }

      return filter;
    };

    const [filter1, filter2] = await Promise.all([
      buildFilter(type1, cat1 || sub1 || remark1),
      buildFilter(type2, cat2 || sub2 || remark2),
    ]);

    const [sum1, sum2] = await Promise.all([
      filter1
        ? prisma.transaction.aggregate({
            _sum: { amount: true },
            where: filter1,
          })
        : { _sum: { amount: 0 } },
      filter2
        ? prisma.transaction.aggregate({
            _sum: { amount: true },
            where: filter2,
          })
        : { _sum: { amount: 0 } },
    ]);

    const total1 = Number(sum1._sum.amount || 0);
    const total2 = Number(sum2._sum.amount || 0);

    const results = [
      { label: comparisonKeyword1, totalSpent: total1 },
      { label: comparisonKeyword2, totalSpent: total2 },
    ];

    const timeRangeText =
      start && end
        ? `between ${start.toDateString()} and ${end.toDateString()}`
        : "of all time";

    const message = `📊 ${comparisonKeyword1} (${type1}) vs ${comparisonKeyword2} (${type2}) expense comparison ${timeRangeText}.`;

    return {
      message,
      comparisonType: `${type1} vs ${type2}`,
      chartType: "pie",
      results,
      startDate: start ?? null,
      endDate: end ?? null,
    };
  } catch (error) {
    console.error("❌ Failed to run expense comparison:", error);
    return { error: "Failed to calculate expense comparison." };
  }
}

/* ----------------------------- EXPORT TOOL ----------------------------- */
export const expenseComparisonTool = createTool({
  name: "expenseComparison",
  description:
    "Compares total spending between two specified keywords (categories, subcategories, or remarks).",
  inputSchema: expenseComparisonSchema,
  execute: runExpenseComparison,
});
