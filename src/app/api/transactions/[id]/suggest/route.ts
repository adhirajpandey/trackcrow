import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.uuid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transactionId = Number(context.params.id);
    if (isNaN(transactionId)) {
      return NextResponse.json({ error: "Invalid transaction ID" }, { status: 400 });
    }

    // Fetch the current transaction to get its recipient
    const currentTransaction = await prisma.transaction.findUnique({
      where: {
        id: transactionId,
        user_uuid: session.user.uuid,
      },
      select: {
        recipient: true,
      },
    });

    if (!currentTransaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Find similar transactions by recipient
    const similarTransactions = await prisma.transaction.findMany({
      where: {
        user_uuid: session.user.uuid,
        recipient: currentTransaction.recipient,
        id: {
          not: transactionId, // Exclude the current transaction
        },
        categoryId: {
          not: null, // Only consider transactions with a category
        },
      },
      orderBy: {
        timestamp: "desc", // Prioritize recent transactions
      },
      select: {
        Category: {
          select: {
            name: true,
          },
        },
        Subcategory: {
          select: {
            name: true,
          },
        },
      },
    });

    let suggestedCategory: string | null = null;
    let suggestedSubCategory: string | null = null;

    if (similarTransactions.length > 0) {
      const categoryCounts = new Map<string, number>();
      const subcategoryCounts = new Map<string, number>();

      for (const txn of similarTransactions) {
        if (txn.Category?.name) {
          categoryCounts.set(txn.Category.name, (categoryCounts.get(txn.Category.name) || 0) + 1);
        }
        if (txn.Subcategory?.name) {
          subcategoryCounts.set(txn.Subcategory.name, (subcategoryCounts.get(txn.Subcategory.name) || 0) + 1);
        }
      }

      // Get the most frequent category
      let maxCategoryCount = 0;
      for (const [category, count] of categoryCounts.entries()) {
        if (count > maxCategoryCount) {
          maxCategoryCount = count;
          suggestedCategory = category;
        }
      }

      // Get the most frequent subcategory
      let maxSubcategoryCount = 0;
      for (const [subcategory, count] of subcategoryCounts.entries()) {
        if (count > maxSubcategoryCount) {
          maxSubcategoryCount = count;
          suggestedSubCategory = subcategory;
        }
      }
    }

    return NextResponse.json({ suggestedCategory, suggestedSubCategory });
  } catch (error) {
    console.error("Error in /api/transactions/[id]/suggest:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}