import "server-only";
import { EmailReportSender } from "./email-sender";
import { Open311ReportSender } from "./open311-sender";
import type { ReportSender } from "./sender";

export { ReportSendError, type ReportSender } from "./sender";

/** Builds the configured sender from env vars, or explains what's missing. */
export function createReportSender(env: NodeJS.ProcessEnv = process.env): ReportSender | { missing: string[] } {
  const kind = (env.REPORT_SENDER ?? "email").toLowerCase();
  if (kind === "open311") {
    const missing = ["OPEN311_BASE_URL", "OPEN311_SERVICE_CODE"].filter((k) => !env[k]);
    if (missing.length) return { missing };
    return new Open311ReportSender(env.OPEN311_BASE_URL!, env.OPEN311_SERVICE_CODE!, env.OPEN311_API_KEY || undefined);
  }
  const missing = ["RESEND_API_KEY", "CITY_311_EMAIL", "REPORT_FROM_EMAIL"].filter((k) => !env[k]);
  if (missing.length) return { missing };
  return new EmailReportSender(env.RESEND_API_KEY!, env.CITY_311_EMAIL!, env.REPORT_FROM_EMAIL!);
}
