import "server-only";
import type { ReportPayload } from "../types";
import { formatReport } from "./format";
import type { ReportSender } from "./sender";

/**
 * REPORT_SENDER=demo — for demos and hackathon judging. Nothing leaves the
 * server: the formatted report is logged and a fake reference is returned.
 */
export class DemoReportSender implements ReportSender {
  readonly channel = "demo";

  async send(report: ReportPayload): Promise<{ reference?: string }> {
    const { subject } = formatReport(report);
    console.info(`[report:demo] would send "${subject}" (${report.photo.length} bytes of photo)`);
    return { reference: `DEMO-${report.monsterId.slice(0, 6).toUpperCase()}` };
  }
}
