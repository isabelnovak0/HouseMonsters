import { afterEach, describe, expect, it, vi } from "vitest";
import { createReportSender } from "@/lib/report";
import { formatReport, REPORT_CATEGORY } from "@/lib/report/format";
import { Open311ReportSender } from "@/lib/report/open311-sender";
import type { ReportPayload } from "@/lib/types";

const payload: ReportPayload = {
  monsterId: "abc12345-0000",
  monsterName: "Creaky Shelby",
  address: "100 Example St, Birmingham, AL",
  location: { lat: 33.52, lng: -86.81, accuracy: 12 },
  foundAt: "2026-11-14T22:32:00.000Z",
  description: "Two-story house <with> boarded windows.",
  conditionTags: ["boarded windows", "overgrowth"],
  photo: "data:image/jpeg;base64,AAAA",
  reporter: { name: "Ada Lovelace", email: "ada@example.com" },
};

afterEach(() => vi.restoreAllMocks());

describe("formatReport", () => {
  it("includes the category, address, coordinates, tags and escapes HTML", () => {
    const r = formatReport(payload);
    expect(r.subject).toContain(REPORT_CATEGORY);
    expect(r.text).toContain("100 Example St");
    expect(r.text).toContain("33.52000, -86.81000 (±12 m)");
    expect(r.text).toContain("boarded windows, overgrowth");
    expect(r.html).toContain("&lt;with&gt;");
    expect(r.html).not.toContain("<with>");
  });
  it("marks anonymous reports", () => {
    expect(formatReport({ ...payload, reporter: undefined }).text).toContain("Not provided (anonymous)");
  });
});

describe("createReportSender", () => {
  it("defaults to email and reports missing config", () => {
    const s = createReportSender({} as NodeJS.ProcessEnv);
    expect(s).toEqual({ missing: ["RESEND_API_KEY", "CITY_311_EMAIL", "REPORT_FROM_EMAIL"] });
  });
  it("builds an email sender when configured", () => {
    const s = createReportSender({ RESEND_API_KEY: "re_x", CITY_311_EMAIL: "a@b.co", REPORT_FROM_EMAIL: "x@y.co" } as unknown as NodeJS.ProcessEnv);
    expect("channel" in s && s.channel).toBe("email");
  });
});

describe("Open311ReportSender", () => {
  it("posts a GeoReport v2 request and returns the service_request_id", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ service_request_id: "SR-42" }]), { status: 201 }),
    );
    const sender = new Open311ReportSender("https://city.example/open311/v2/", "BLIGHT", "key1");
    await expect(sender.send(payload)).resolves.toEqual({ reference: "SR-42" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://city.example/open311/v2/requests.json");
    const body = new URLSearchParams(String((init as RequestInit).body));
    expect(body.get("service_code")).toBe("BLIGHT");
    expect(body.get("lat")).toBe("33.52");
    expect(body.get("first_name")).toBe("Ada");
    expect(body.get("last_name")).toBe("Lovelace");
  });
  it("marks 5xx as retryable", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 503 }));
    await expect(new Open311ReportSender("https://x", "S").send(payload)).rejects.toMatchObject({ retryable: true });
  });
});
