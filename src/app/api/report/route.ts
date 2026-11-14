import { NextResponse } from "next/server";
import { z } from "zod";
import { createReportSender, ReportSendError } from "@/lib/report";
import type { ReportResult } from "@/lib/types";

export const runtime = "nodejs";

const PayloadSchema = z.object({
  monsterId: z.string().min(1).max(100),
  monsterName: z.string().max(15),
  address: z.string().min(1).max(300),
  location: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), accuracy: z.number().optional() }),
  foundAt: z.string().datetime(),
  description: z.string().min(1).max(2000),
  conditionTags: z.array(z.string().max(60)).max(20),
  photo: z.string().regex(/^data:image\/(jpeg|png|webp);base64,/).max(8_000_000),
  reporter: z
    .object({
      name: z.string().max(100).optional(),
      email: z.string().email().max(200).optional().or(z.literal("")),
      phone: z.string().max(40).optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json<ReportResult>({ ok: false, channel: "none", error: "Expected JSON." }, { status: 400 });
  }
  const parsed = PayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json<ReportResult>(
      { ok: false, channel: "none", error: "Some report fields are missing or invalid." },
      { status: 400 },
    );
  }

  const sender = createReportSender();
  if ("missing" in sender) {
    console.error("[report] sender not configured, missing:", sender.missing.join(", "));
    return NextResponse.json<ReportResult>(
      { ok: false, channel: "none", error: "Reporting isn't set up on this server yet." },
      { status: 503 },
    );
  }

  try {
    const { reference } = await sender.send(parsed.data);
    return NextResponse.json<ReportResult>({ ok: true, channel: sender.channel, reference });
  } catch (error) {
    const retryable = error instanceof ReportSendError ? error.retryable : true;
    console.error("[report] send failed:", (error as Error).message);
    return NextResponse.json<ReportResult>(
      { ok: false, channel: sender.channel, error: retryable ? "Couldn't reach the city right now." : "The report was rejected." },
      { status: retryable ? 502 : 422 },
    );
  }
}
