import { formatCoords } from "../geo";
import type { ReportPayload } from "../types";

export const REPORT_CATEGORY = "Abandoned / vacant / dilapidated structure";

export interface FormattedReport {
  subject: string;
  text: string;
  html: string;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Plain-language report a 311 agent can act on without the app. */
export function formatReport(r: ReportPayload): FormattedReport {
  const coords = formatCoords(r.location);
  const mapUrl = `https://www.openstreetmap.org/?mlat=${r.location.lat}&mlon=${r.location.lng}#map=18/${r.location.lat}/${r.location.lng}`;
  const contact = [r.reporter?.name, r.reporter?.email, r.reporter?.phone].filter(Boolean).join(" · ") || "Not provided (anonymous)";
  const tags = r.conditionTags.length ? r.conditionTags.join(", ") : "None listed";

  const rows: [string, string][] = [
    ["Category", REPORT_CATEGORY],
    ["Address", r.address],
    ["GPS", `${coords}${r.location.accuracy ? ` (±${Math.round(r.location.accuracy)} m)` : ""}`],
    ["Observed", `${when(r.foundAt)} (Central)`],
    ["Visible conditions", tags],
    ["Description", r.description],
    ["Reporter", contact],
  ];

  const subject = `311 report: ${REPORT_CATEGORY} at ${r.address}`;
  const text = [
    "A resident reported a possibly abandoned or dilapidated house using the House Monsters app.",
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    `Map: ${mapUrl}`,
    "",
    "A photo is attached.",
  ].join("\n");

  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#222">
<p>A resident reported a possibly abandoned or dilapidated house using the House Monsters app.</p>
<table cellpadding="6" style="border-collapse:collapse">
${rows.map(([k, v]) => `<tr><th align="left" valign="top" style="border-bottom:1px solid #ddd">${escapeHtml(k)}</th><td style="border-bottom:1px solid #ddd">${escapeHtml(v)}</td></tr>`).join("\n")}
<tr><th align="left">Map</th><td><a href="${escapeHtml(mapUrl)}">Open location on a map</a></td></tr>
</table>
<p>A photo of the house is attached.</p>
</body></html>`;

  return { subject, text, html };
}
