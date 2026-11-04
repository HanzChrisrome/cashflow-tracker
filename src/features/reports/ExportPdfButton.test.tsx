import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import type { TransactionItem } from "@/features/transactions/api";
import { summarizeTransactions } from "@/features/transactions/totals";

import { ExportPdfButton } from "./ExportPdfButton";
import { generateTransactionsPdf } from "./pdf/generate-transactions-pdf";
import { downloadBlob } from "./pdf/download";
import { ROW_CAP } from "./report-model";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("./use-business-name", () => ({
  FALLBACK_BUSINESS_NAME: "Cashflow Tracker",
  useBusinessName: () => ({ data: "Juan's Store" }),
}));

vi.mock("./pdf/generate-transactions-pdf", () => ({
  generateTransactionsPdf: vi.fn(),
}));

vi.mock("./pdf/download", () => ({
  downloadBlob: vi.fn(),
}));

const generateMock = vi.mocked(generateTransactionsPdf);
const downloadBlobMock = vi.mocked(downloadBlob);

function tx(id: string): TransactionItem {
  return {
    id,
    type: id === "t1" ? "cash_in" : "cash_out",
    accountId: "a1",
    accountLabel: "GCash · Main",
    amount: "100",
    fee: "5",
    countFee: true,
    timestamp: "2026-10-29T10:00",
    onHold: false,
  };
}

function renderButton(transactions: TransactionItem[]) {
  return render(
    <ExportPdfButton
      transactions={transactions}
      accountLabel="All accounts"
      filter="Today"
      fromDate=""
      toDate=""
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ExportPdfButton", () => {
  it("is disabled with a reason when there are no transactions", () => {
    renderButton([]);

    const button = screen.getByRole("button", { name: "Export PDF" });
    expect(button).toBeDisabled();
    expect(
      screen.getByText("No transactions to export."),
    ).toBeInTheDocument();
  });

  it("is disabled with a reason when the row cap is exceeded", () => {
    const many = Array.from({ length: ROW_CAP + 1 }, (_, index) =>
      tx(`t${index}`),
    );
    renderButton(many);

    const button = screen.getByRole("button", { name: "Export PDF" });
    expect(button).toBeDisabled();
    expect(
      screen.getByText(/2,001 transactions exceed the 2,000-row limit/),
    ).toBeInTheDocument();
  });

  it("builds the report from the filtered data and downloads it", async () => {
    const transactions = [tx("t1"), tx("t2")];
    const blob = new Blob(["pdf"], { type: "application/pdf" });
    generateMock.mockResolvedValue(blob);
    const user = userEvent.setup();

    renderButton(transactions);
    await user.click(screen.getByRole("button", { name: "Export PDF" }));

    await waitFor(() => expect(generateMock).toHaveBeenCalledTimes(1));
    const model = generateMock.mock.calls[0][0];
    expect(model.businessName).toBe("Juan's Store");
    expect(model.accountText).toBe("All accounts");
    expect(model.periodText).toContain("Today");
    expect(model.summary).toEqual(summarizeTransactions(transactions));
    expect(model.rows).toHaveLength(2);
    expect(model.filename).toMatch(/^transactions_\d{4}-\d{2}-\d{2}_all-accounts\.pdf$/);
    expect(downloadBlobMock).toHaveBeenCalledWith(blob, model.filename);
    expect(toast.success).toHaveBeenCalledWith("Report downloaded.");
  });

  it("shows a loading state while the report is built", async () => {
    generateMock.mockImplementation(
      () => new Promise(() => {}) as Promise<Blob>,
    );
    const user = userEvent.setup();

    renderButton([tx("t1")]);
    await user.click(screen.getByRole("button", { name: "Export PDF" }));

    const busy = screen.getByRole("button", { name: "Preparing PDF…" });
    expect(busy).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Export PDF" }),
    ).not.toBeInTheDocument();
  });

  it("shows an error toast when generation fails", async () => {
    generateMock.mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();

    renderButton([tx("t1")]);
    await user.click(screen.getByRole("button", { name: "Export PDF" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Could not create the PDF. Please try again.",
      ),
    );
    expect(downloadBlobMock).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Export PDF" })).toBeEnabled();
  });
});
