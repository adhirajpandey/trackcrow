import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { transactionReadSchema } from "@/common/schemas";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Pagination params: page (1-based) and size
    const { searchParams } = new URL(req.url);
    const pageParam = searchParams.get("page");
    const sizeParam = searchParams.get("size");
    const qParam = searchParams.get("q");
    const sortBy = searchParams.get("sortBy");
    const sortOrder = searchParams.get("sortOrder");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Category filters: ?category=A&category=B or ?categories=A,B
    const categoryParams = searchParams.getAll("category");
    const categoriesCsv = searchParams.get("categories");
    const categoriesFromCsv = categoriesCsv
      ? categoriesCsv
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const categoryFilters = Array.from(
      new Set([...categoryParams, ...categoriesFromCsv])
    );

    // Parse and clamp pagination: page >= 1; size in [1, 100]; defaults 1 and 20.
    const pageNum = Number(pageParam);
    const page = Number.isFinite(pageNum)
      ? Math.max(1, Math.floor(pageNum))
      : 1;
    const sizeNum = Number(sizeParam);
    const pageSize = Number.isFinite(sizeNum)
      ? Math.max(1, Math.min(100, Math.floor(sizeNum)))
      : 20;

    // Compute offset for pagination
    const skip = (page - 1) * pageSize;

    // Optional search across recipient, recipient_name, remarks, amount
    const q = (qParam ?? "").trim();
    const orFilters: any[] = [];
    if (q.length > 0) {
      orFilters.push(
        { recipient: { contains: q, mode: "insensitive" } },
        { recipient_name: { contains: q, mode: "insensitive" } },
        { remarks: { contains: q, mode: "insensitive" } }
      );
      const qDigits = q.replace(/[^0-9.-]/g, "");
      const qNum = Number(qDigits);
      if (Number.isFinite(qNum)) {
        orFilters.push({ amount: qNum });
      }
    }

    // Category filter as AND clause (matches any selected category, including 'Uncategorized')
    const andFilters: any[] = [];
    if (categoryFilters.length > 0) {
      const includeUncategorized = categoryFilters.some(
        (c) => c.toLowerCase() === "uncategorized"
      );
      const named = categoryFilters.filter(
        (c) => c && c.toLowerCase() !== "uncategorized"
      );
      const ors: any[] = [];
      if (named.length > 0) ors.push({ Category: { name: { in: named } } });
      if (includeUncategorized) ors.push({ categoryId: null });
      if (ors.length > 0) andFilters.push({ OR: ors });
    }

    const where: any = {
      user_uuid: session.user.uuid,
      ...(orFilters.length > 0 ? { OR: orFilters } : {}),
      ...(andFilters.length > 0 ? { AND: andFilters } : {}),
    };

    if (startDateParam) {
      where.timestamp = { ...where.timestamp, gte: new Date(startDateParam) };
    }
    if (endDateParam) {
      where.timestamp = { ...where.timestamp, lte: new Date(endDateParam) };
    }

    const firstTxn = await prisma.transaction.findFirst({
      where: { user_uuid: session.user.uuid },
      orderBy: { timestamp: "asc" },
      select: { timestamp: true },
    });

    const lastTxn = await prisma.transaction.findFirst({
      where: { user_uuid: session.user.uuid },
      orderBy: { timestamp: "desc" },
      select: { timestamp: true },
    });

    const firstTxnDate = firstTxn?.timestamp || null;
    const lastTxnDate = lastTxn?.timestamp || null;

    const total = await prisma.transaction.count({ where });
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    // If requested page is out of range, return empty result with metadata
    let transactions: Array<any> = [];

    if (total > 0 && page <= totalPages) {
      const orderBy: any = {};
      if (sortBy === "timestamp") {
        orderBy.timestamp = sortOrder === "asc" ? "asc" : "desc";
      } else if (sortBy === "amount") {
        orderBy.amount = sortOrder === "asc" ? "asc" : "desc";
      } else {
        orderBy.timestamp = "desc";
      }

      transactions = await prisma.transaction.findMany({
        where,
        orderBy,
        // Select only fields used by the API response
        select: {
          user_uuid: true,
          id: true,
          timestamp: true,
          recipient: true,
          amount: true,
          type: true,
          recipient_name: true,
          remarks: true,
          location: true,
          Category: { select: { name: true } },
          Subcategory: { select: { name: true } },
        },
        skip,
        take: pageSize,
      });
    }

    const flat = transactions.map((t) => ({
      user_uuid: t.user_uuid,
      id: t.id,
      timestamp: t.timestamp,
      recipient: t.recipient,
      amount: Number(t.amount),
      type: t.type,
      location: t.location ?? null,
      recipient_name: t.recipient_name ?? null,
      category: t.Category?.name ?? null,
      subcategory: t.Subcategory?.name ?? null,
      remarks: t.remarks ?? null,
    }));

    const parsed = z.array(transactionReadSchema).safeParse(flat);

    if (!parsed.success) {
      console.error("Transaction read validation error", parsed.error);
      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 }
      );
    }

    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return NextResponse.json(
      {
        transactions: parsed.data,
        page,
        pageSize,
        total,
        totalPages,
        hasNext,
        hasPrev,
        firstTxnDate,
        lastTxnDate,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("/api/transactions GET error", e);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
