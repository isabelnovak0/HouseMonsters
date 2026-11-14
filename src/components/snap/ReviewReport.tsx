"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { BackIcon, SendIcon } from "@/components/ui/icons";
import { MiniMap } from "@/components/ui/MiniMap";
import { CONDITION_TAGS } from "@/lib/analysis-schema";
import { geocodeAddress } from "@/lib/client/api";
import { LOCATION_HELP, type LocationError } from "@/lib/client/location";
import type { GeoPoint, ReporterContact } from "@/lib/types";

export interface ReviewValues {
  address: string;
  location?: GeoPoint;
  description: string;
  conditionTags: string[];
  reporter: ReporterContact;
}

export interface ReviewReportProps {
  photo: string;
  foundAt: string;
  values: ReviewValues;
  onChange: (patch: Partial<ReviewValues>) => void;
  locationError?: LocationError;
  addressLoading: boolean;
  /** Shown when Claude couldn't describe the photo, so the user writes it. */
  descriptionNote?: string;
  sending: boolean;
  error?: string;
  onBack: () => void;
  onSend: () => void;
  onCancel: () => void;
}

const field =
  "w-full rounded-xl border-2 border-[#a8987a] bg-white px-3 text-[15px] text-ink outline-none focus:border-ink focus:ring-4 focus:ring-butter";

/** Simple, editable summary of the 311 report. Nothing is sent until the user taps Send. */
export function ReviewReport({
  photo,
  foundAt,
  values,
  onChange,
  locationError,
  addressLoading,
  descriptionNote,
  sending,
  error,
  onBack,
  onSend,
  onCancel,
}: ReviewReportProps) {
  const [lookup, setLookup] = useState<"idle" | "busy" | "failed">("idle");
  const [showContact, setShowContact] = useState(Boolean(values.reporter.name || values.reporter.email || values.reporter.phone));

  async function findAddress() {
    if (!values.address.trim()) return;
    setLookup("busy");
    try {
      const hit = await geocodeAddress(values.address);
      onChange({ location: { lat: hit.lat, lng: hit.lng }, address: hit.address });
      setLookup("idle");
    } catch {
      setLookup("failed");
    }
  }

  const toggleTag = (tag: string) =>
    onChange({
      conditionTags: values.conditionTags.includes(tag)
        ? values.conditionTags.filter((t) => t !== tag)
        : [...values.conditionTags, tag],
    });

  const canSend = Boolean(values.location && values.address.trim() && values.description.trim()) && !sending;
  const missing = !values.location
    ? "Add the house's address so the city can find it."
    : !values.description.trim()
      ? "Add a short description of the house."
      : undefined;

  return (
    <div className="flex min-h-dvh flex-col pb-[max(1.75rem,env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-1 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button type="button" onClick={onBack} aria-label="Back to your monster" className="flex h-11 w-11 items-center justify-center rounded-full">
          <BackIcon className="h-6 w-6" />
        </button>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-[22px] font-semibold leading-tight">Review your report</h1>
          <p className="text-[13px] text-ink-soft">Nothing is sent until you tap Send.</p>
        </div>
      </header>

      <div className="mx-5 mt-3 flex flex-col gap-4 rounded-[20px] border-2 border-ink bg-paper p-3.5">
        <div className="grid grid-cols-2 gap-2.5">
          <img src={photo} alt="Your photo of the house" className="h-[110px] w-full rounded-xl border-2 border-ink object-cover" />
          {values.location ? (
            <MiniMap point={values.location} className="h-[110px] rounded-xl border-2 border-ink" />
          ) : (
            <div className="flex h-[110px] items-center justify-center rounded-xl border-2 border-dashed border-[#a8987a] p-2 text-center text-xs font-semibold text-ink-soft">
              {locationError ? LOCATION_HELP[locationError] : "No location yet"} Type the address below.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="addr" className="text-[13px] font-bold text-ink-soft">
            {values.location && !locationError ? "Location · from your GPS" : "Address"}
          </label>
          <div className="flex gap-2">
            <input
              id="addr"
              type="text"
              value={addressLoading ? "Looking up the address…" : values.address}
              disabled={addressLoading}
              onChange={(e) => onChange({ address: e.target.value })}
              placeholder="Street address, Birmingham, AL"
              autoComplete="street-address"
              className={`${field} h-[46px] font-semibold`}
            />
            {!values.location && (
              <button
                type="button"
                onClick={findAddress}
                disabled={lookup === "busy" || !values.address.trim()}
                className="h-[46px] shrink-0 rounded-xl border-2 border-ink bg-butter px-3 text-sm font-bold disabled:opacity-50"
              >
                {lookup === "busy" ? "Finding…" : "Find"}
              </button>
            )}
          </div>
          {lookup === "failed" && <p className="text-xs font-semibold text-[#b03a22]">We couldn't find that address. Try adding the street type or ZIP code.</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <label htmlFor="desc" className="text-[13px] font-bold text-ink-soft">
              {descriptionNote ? "What you see" : "What we see · written by AI"}
            </label>
            {!descriptionNote && <span className="text-xs font-bold text-sky">Tap to edit</span>}
          </div>
          {descriptionNote && <p className="text-xs text-ink-soft">{descriptionNote}</p>}
          <textarea
            id="desc"
            rows={4}
            value={values.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="e.g. One-story house, windows boarded up, yard overgrown, front door open."
            maxLength={2000}
            className={`${field} resize-none py-2.5 leading-snug`}
          />
          <fieldset className="flex flex-wrap gap-1.5">
            <legend className="sr-only">Visible conditions</legend>
            {CONDITION_TAGS.map((tag) => {
              const on = values.conditionTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleTag(tag)}
                  className={`min-h-8 rounded-full border-[1.5px] border-ink px-2.5 text-xs font-bold ${on ? "bg-ink text-paper" : "bg-parchment text-ink-soft"}`}
                >
                  {tag}
                </button>
              );
            })}
          </fieldset>
        </div>

        <div className="grid grid-cols-2 gap-2.5 text-[13px]">
          <div>
            <div className="font-bold text-ink-soft">Found</div>
            <div className="font-semibold">
              {new Date(foundAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </div>
          </div>
          <div>
            <div className="font-bold text-ink-soft">Sent to</div>
            <div className="font-semibold">Birmingham 311</div>
          </div>
        </div>

        <div>
          <button type="button" onClick={() => setShowContact((s) => !s)} aria-expanded={showContact} className="text-[13px] font-bold text-sky underline">
            {showContact ? "Hide contact info" : "Add your contact info (optional)"}
          </button>
          {showContact && (
            <div className="mt-2 flex flex-col gap-2">
              <input
                aria-label="Your name"
                placeholder="Your name"
                autoComplete="name"
                value={values.reporter.name ?? ""}
                onChange={(e) => onChange({ reporter: { ...values.reporter, name: e.target.value } })}
                className={`${field} h-11`}
              />
              <input
                aria-label="Your email"
                placeholder="Email"
                type="email"
                autoComplete="email"
                value={values.reporter.email ?? ""}
                onChange={(e) => onChange({ reporter: { ...values.reporter, email: e.target.value } })}
                className={`${field} h-11`}
              />
              <input
                aria-label="Your phone"
                placeholder="Phone"
                type="tel"
                autoComplete="tel"
                value={values.reporter.phone ?? ""}
                onChange={(e) => onChange({ reporter: { ...values.reporter, phone: e.target.value } })}
                className={`${field} h-11`}
              />
              <p className="text-xs text-ink-soft">We'll remember this on this phone for next time.</p>
            </div>
          )}
        </div>
      </div>

      <p className="mx-6 mt-3 text-xs leading-snug text-ink-soft">
        Sending shares this photo, the location and any contact info you added with the City of Birmingham.
      </p>

      <div className="mt-auto flex flex-col gap-2 px-5 pt-4">
        {(error || missing) && (
          <p role="alert" className={`text-center text-sm font-semibold ${error ? "text-[#b03a22]" : "text-ink-soft"}`}>
            {error ?? missing}
          </p>
        )}
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          className="sticker flex h-[58px] items-center justify-center gap-2.5 rounded-2xl bg-sky font-[family-name:var(--font-display)] text-lg font-semibold text-paper disabled:opacity-50"
        >
          <SendIcon className="h-5 w-5" />
          {sending ? "Sending…" : "Send to 311"}
        </button>
        <button type="button" onClick={onCancel} disabled={sending} className="h-12 font-[family-name:var(--font-display)] text-base font-semibold">
          Cancel, don't send
        </button>
      </div>
    </div>
  );
}
