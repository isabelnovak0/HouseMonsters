import "server-only";
import type { ReportPayload } from "../types";
import { formatReport } from "./format";
import { ReportSendError, type ReportSender } from "./sender";

/**
 * Open311 GeoReport v2 client (POST /requests.json). Birmingham does not publish
 * an Open311 endpoint today (DECISIONS.md D-009); this is ready for when it does,
 * or for testing against another city's sandbox. Photos need a public URL in
 * GeoReport v2 (`media_url`), which v1 doesn't host, so the photo is not sent here.
 */
export class Open311ReportSender implements ReportSender {
  readonly channel = "open311";

  constructor(
    private readonly baseUrl: string,
    private readonly serviceCode: string,
    private readonly apiKey?: string,
  ) {}

  async send(report: ReportPayload): Promise<{ reference?: string }> {
    const { text } = formatReport(report);
    const [first, ...rest] = (report.reporter?.name ?? "").trim().split(/\s+/);
    const form = new URLSearchParams({
      service_code: this.serviceCode,
      lat: String(report.location.lat),
      long: String(report.location.lng),
      address_string: report.address,
      description: text.slice(0, 4000),
    });
    if (this.apiKey) form.set("api_key", this.apiKey);
    if (report.reporter?.email) form.set("email", report.reporter.email);
    if (report.reporter?.phone) form.set("phone", report.reporter.phone);
    if (first) form.set("first_name", first);
    if (rest.length) form.set("last_name", rest.join(" "));

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl.replace(/\/$/, "")}/requests.json`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
      });
    } catch (e) {
      throw new ReportSendError(`open311 network: ${(e as Error).message}`, true);
    }
    if (!res.ok) {
      throw new ReportSendError(`open311 ${res.status}`, res.status === 429 || res.status >= 500);
    }
    const body = (await res.json().catch(() => [])) as { service_request_id?: string; token?: string }[];
    return { reference: body[0]?.service_request_id ?? body[0]?.token };
  }
}
