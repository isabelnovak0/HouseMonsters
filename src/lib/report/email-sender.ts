import "server-only";
import { Resend } from "resend";
import type { ReportPayload } from "../types";
import { formatReport } from "./format";
import { parseDataUrl, ReportSendError, type ReportSender } from "./sender";

/** Emails the report (photo attached) via Resend to CITY_311_EMAIL. */
export class EmailReportSender implements ReportSender {
  readonly channel = "email";
  private readonly resend: Resend;

  constructor(
    apiKey: string,
    private readonly to: string,
    private readonly from: string,
  ) {
    this.resend = new Resend(apiKey);
  }

  async send(report: ReportPayload): Promise<{ reference?: string }> {
    const { subject, text, html } = formatReport(report);
    const photo = parseDataUrl(report.photo);
    const ext = photo?.mediaType === "image/png" ? "png" : photo?.mediaType === "image/webp" ? "webp" : "jpg";

    const { data, error } = await this.resend.emails.send({
      from: this.from,
      to: [this.to],
      subject,
      text,
      html,
      replyTo: report.reporter?.email || undefined,
      attachments: photo ? [{ filename: `house-${report.monsterId.slice(0, 8)}.${ext}`, content: photo.base64 }] : undefined,
    });
    if (error) {
      const status = (error as { statusCode?: number }).statusCode ?? 0;
      throw new ReportSendError(`resend: ${error.message}`, status === 0 || status === 429 || status >= 500);
    }
    return { reference: data?.id };
  }
}
