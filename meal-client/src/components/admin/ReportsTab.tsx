"use client";

import React from "react";
import type { UseAdminReportReturn } from "@/hooks/useAdminReport";
import { MealReportGrid } from "./MealReportGrid";
import { ReportRangeControls } from "./ReportRangeControls";
import { ReportSummaryCards } from "./ReportSummaryCards";

export interface ReportsTabProps {
  report: UseAdminReportReturn;
  onExportCsv: () => void;
}

/**
 * Attendance & meal report generator: range controls → KPI summary →
 * spreadsheet data-sheet preview (columns A–K) ready for CSV export.
 */
export function ReportsTab({ report, onExportCsv }: ReportsTabProps) {
  return (
    <div className="space-y-4">
      <ReportRangeControls report={report} onExportCsv={onExportCsv} />

      {report.summary && <ReportSummaryCards summary={report.summary} />}

      <MealReportGrid
        rows={report.gridRows}
        isLoading={report.isLoading}
        searchTerm={report.searchTerm}
        onSearchChange={report.setSearchTerm}
        fromDate={report.fromDate}
        toDate={report.toDate}
      />
    </div>
  );
}
