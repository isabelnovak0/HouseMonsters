import type { ReportPayload } from "../types";

/** One way of delivering a report to the city. Pick with REPORT_SENDER (see DECISIONS.md D-009). */
export interface ReportSender {
  readonly channel: string;
  /** Resolves with a reference id when the receiving system returns one. Throws ReportSendError on failure. */
  send(report: ReportPayload): Promise<{ reference?: string }>;
}

export class ReportSendError extends Error {
  constructor(
    message: string,
    /** True for network/5xx/rate-limit problems worth retrying later. */
    public readonly retryable: boolean,
  ) {
    super(message);
  }
}

/** Splits "data:image/jpeg;base64,AAAA" into its parts. */
export function parseDataUrl(dataUrl: string): { mediaType: string; base64: string } | null {
  const m = /^data:([a-z]+\/[a-z0-9.+-]+);base64,(.+)$/i.exec(dataUrl);
  return m ? { mediaType: m[1], base64: m[2] } : null;
}
