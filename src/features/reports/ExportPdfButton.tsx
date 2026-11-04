import { useState } from "react";
import { FileDown, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { TransactionItem } from "@/features/transactions/api";
import { FALLBACK_BUSINESS_NAME, useBusinessName } from "./use-business-name";
import {
  buildReportModel,
  ROW_CAP,
  type TransactionsFilter,
} from "./report-model";
import { downloadBlob } from "./pdf/download";

export function ExportPdfButton({
  transactions,
  accountLabel,
  filter,
  fromDate,
  toDate,
}: {
  transactions: TransactionItem[];
  accountLabel: string;
  filter: TransactionsFilter;
  fromDate: string;
  toDate: string;
}) {
  const businessNameQuery = useBusinessName();
  const [isExporting, setIsExporting] = useState(false);

  const count = transactions.length;
  const disabledReason =
    count === 0
      ? "No transactions to export."
      : count > ROW_CAP
        ? `${count.toLocaleString("en-PH")} transactions exceed the ${ROW_CAP.toLocaleString("en-PH")}-row limit. Narrow the filters to export.`
        : null;

  async function handleExport() {
    setIsExporting(true);
    try {
      const model = buildReportModel({
        transactions,
        accountLabel,
        filter,
        fromDate,
        toDate,
        businessName: businessNameQuery.data ?? FALLBACK_BUSINESS_NAME,
      });
      const { generateTransactionsPdf } = await import(
        "./pdf/generate-transactions-pdf"
      );
      const blob = await generateTransactionsPdf(model);
      downloadBlob(blob, model.filename);
      toast.success("Report downloaded.");
    } catch {
      toast.error("Could not create the PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant="outline"
        className="h-10 rounded-xl"
        disabled={isExporting || disabledReason !== null}
        onClick={handleExport}
      >
        {isExporting ? (
          <LoaderCircle className="animate-spin" />
        ) : (
          <FileDown />
        )}
        {isExporting ? "Preparing PDF…" : "Export PDF"}
      </Button>
      {disabledReason && (
        <p className="max-w-48 text-xs leading-snug text-muted-foreground">
          {disabledReason}
        </p>
      )}
    </div>
  );
}
