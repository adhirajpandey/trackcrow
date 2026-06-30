import {
  buildTransactionTableFooterSummary,
  getTransactionTableColumnLabels,
  paginateTransactionTableRows,
  sortTransactionTableRows,
  toggleTransactionTableSort,
  type TransactionTableRow,
} from "./transactions-table-model";

const rows: TransactionTableRow[] = [
  {
    id: 2,
    uuid: "txn-2",
    recipient: "Beta",
    amount: 50,
    category: "Food",
    subcategory: "Dinner",
    timestamp: "2026-06-29T10:00:00.000Z",
  },
  {
    id: 1,
    uuid: "txn-1",
    recipient: "Alpha",
    amount: 100,
    category: null,
    subcategory: null,
    timestamp: "2026-06-30T10:00:00.000Z",
  },
  {
    id: 3,
    uuid: "txn-3",
    recipient: "Gamma",
    amount: 75,
    category: "Travel",
    subcategory: "Cab",
    timestamp: "2026-06-28T10:00:00.000Z",
  },
];

describe("transactions table model", () => {
  it("maps configured columns to display labels", () => {
    expect(getTransactionTableColumnLabels(["timestamp", "amount", "subcategory"])).toEqual([
      "Date & time",
      "Amount",
      "Subcategory",
    ]);
  });

  it("toggles active sort direction and defaults new columns to descending", () => {
    expect(toggleTransactionTableSort({ sortBy: "timestamp", sortOrder: "desc" }, "timestamp")).toEqual({
      sortBy: "timestamp",
      sortOrder: "asc",
    });
    expect(toggleTransactionTableSort({ sortBy: "timestamp", sortOrder: "asc" }, "amount")).toEqual({
      sortBy: "amount",
      sortOrder: "desc",
    });
  });

  it("sorts rows by timestamp and amount", () => {
    expect(sortTransactionTableRows(rows, "timestamp", "desc").map((row) => row.uuid)).toEqual([
      "txn-1",
      "txn-2",
      "txn-3",
    ]);
    expect(sortTransactionTableRows(rows, "amount", "asc").map((row) => row.uuid)).toEqual([
      "txn-2",
      "txn-3",
      "txn-1",
    ]);
  });

  it("paginates rows and builds a transaction footer summary", () => {
    const page = paginateTransactionTableRows(rows, 2, 2);

    expect(page.rows.map((row) => row.uuid)).toEqual(["txn-3"]);
    expect(page.pagination).toEqual({
      page: 2,
      pageSize: 2,
      total: 3,
      totalPages: 2,
      hasPrev: true,
      hasNext: false,
    });
    expect(buildTransactionTableFooterSummary(page.pagination)).toBe(
      "Showing 3 to 3 of 3 transactions"
    );
  });
});
