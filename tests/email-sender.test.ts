import { afterEach, describe, expect, it, vi } from "vitest";
import { EmailReportSender } from "@/lib/report/email-sender";

afterEach(() => vi.restoreAllMocks());

describe("EmailReportSender", () => {
  it("sends one email to CITY_311_EMAIL with the photo attached", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ id: "email_123" }), { status: 200, headers: { "content-type": "application/json" } }));
    const sender = new EmailReportSender("re_test", "inbox@example.com", "House Monsters <onboarding@resend.dev>");
    const result = await sender.send({
      monsterId: "abcdef12-3456",
      monsterName: "Mystery House",
      address: "100 Example St, Birmingham, AL",
      location: { lat: 33.5, lng: -86.8 },
      foundAt: "2026-11-14T20:00:00.000Z",
      description: "House that appears to be vacant.",
      conditionTags: [],
      photo: "data:image/jpeg;base64,QUJD",
    });
    expect(result.reference).toBe("email_123");
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://api.resend.com/emails");
    const body = JSON.parse(String((init as RequestInit).body));
    expect(body.to).toEqual(["inbox@example.com"]);
    expect(body.from).toBe("House Monsters <onboarding@resend.dev>");
    expect(body.subject).toContain("100 Example St");
    expect(body.attachments[0]).toMatchObject({ filename: "house-abcdef12.jpg", content: "QUJD" });
  });
});
