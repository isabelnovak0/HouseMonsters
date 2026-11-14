"use client";

import { useRouter } from "next/navigation";
import { useReducer } from "react";
import type { MonsterLook } from "@/components/monster/Monster";
import { Analyzing, NotAHouse } from "@/components/snap/Analyzing";
import { CameraView, type Capture } from "@/components/snap/CameraView";
import { Done } from "@/components/snap/Done";
import { Reveal } from "@/components/snap/Reveal";
import { ReviewReport, type ReviewValues } from "@/components/snap/ReviewReport";
import { analyzePhoto, ApiError, isRetryable, reverseGeocode, sendReport } from "@/lib/client/api";
import type { LocationError } from "@/lib/client/location";
import { markReported, toPayload } from "@/lib/client/outbox";
import { samplePalette } from "@/lib/client/photo";
import { formatCoords } from "@/lib/geo";
import { chooseAnimal, hash, pickDances, type DanceMove } from "@/lib/monster";
import { findNearbyDuplicate, NEW_HOUSE_POINTS } from "@/lib/points";
import { monsters as monsterRepo, settings } from "@/lib/storage";
import type { HouseFeatures, Monster, ReporterContact } from "@/lib/types";
import { MAX_NAME_LENGTH } from "@/lib/types";

/** Used when Claude can't analyze the photo: a house shape picked from the id, painted in the photo's colors. */
function fallbackFeatures(id: string): HouseFeatures {
  const h = hash(id);
  return {
    roofShape: (["gable", "hip", "flat"] as const)[h % 3],
    stories: 1 + ((h >> 3) % 2),
    windowCount: 2 + ((h >> 5) % 3),
    doorPosition: (["center", "left", "right"] as const)[(h >> 7) % 3],
    porch: ((h >> 9) & 1) === 1,
    chimney: ((h >> 10) & 1) === 1,
  };
}

/** Starter text when the AI description isn't available; the user is asked to add what they see. */
const FALLBACK_DESCRIPTION = "House that appears to be vacant or abandoned, reported by a resident. Photo attached. ";

type Step = "camera" | "analyzing" | "notHouse" | "reveal" | "review" | "done";

interface State {
  step: Step;
  id: string;
  foundAt: string;
  photo: string;
  locationError?: LocationError;
  look?: MonsterLook;
  dances: DanceMove[];
  name: string;
  notHouseText: string;
  analysisNote?: string;
  /** Points this catch earns when reported (0 if it duplicates an existing house). */
  catchPoints: number;
  duplicateOf?: string;
  review: ReviewValues;
  addressLoading: boolean;
  sending: boolean;
  sendError?: string;
  saved?: Monster;
  queued: boolean;
}

type Action =
  | { type: "captured"; capture: Capture; id: string }
  | { type: "notHouse"; text: string }
  | { type: "analyzed"; look: MonsterLook; name: string; description: string; tags: string[]; note?: string; catchPoints: number; duplicateOf?: string; reporter?: ReporterContact }
  | { type: "address"; address?: string }
  | { type: "name"; name: string }
  | { type: "goto"; step: Step }
  | { type: "review"; patch: Partial<ReviewValues> }
  | { type: "sending" }
  | { type: "sendFailed"; error: string }
  | { type: "done"; monster: Monster; queued: boolean }
  | { type: "reset" };

const emptyReview: ReviewValues = { address: "", description: "", conditionTags: [], reporter: {} };

const initial: State = {
  step: "camera",
  id: "",
  foundAt: "",
  photo: "",
  dances: [],
  name: "",
  notHouseText: "",
  catchPoints: NEW_HOUSE_POINTS,
  review: emptyReview,
  addressLoading: false,
  sending: false,
  queued: false,
};

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "captured":
      return {
        ...initial,
        step: "analyzing",
        id: a.id,
        foundAt: new Date().toISOString(),
        photo: a.capture.photo,
        locationError: a.capture.locationError,
        dances: pickDances(a.id),
        addressLoading: Boolean(a.capture.location),
        review: { ...emptyReview, location: a.capture.location },
      };
    case "notHouse":
      return { ...s, step: "notHouse", notHouseText: a.text };
    case "analyzed":
      return {
        ...s,
        step: "reveal",
        look: a.look,
        name: a.name,
        analysisNote: a.note,
        catchPoints: a.catchPoints,
        duplicateOf: a.duplicateOf,
        review: { ...s.review, description: a.description, conditionTags: a.tags, reporter: a.reporter ?? {} },
      };
    case "address":
      return {
        ...s,
        addressLoading: false,
        review: { ...s.review, address: s.review.address || a.address || (s.review.location ? formatCoords(s.review.location) : "") },
      };
    case "name":
      return { ...s, name: a.name.slice(0, MAX_NAME_LENGTH) };
    case "goto":
      return { ...s, step: a.step, sendError: undefined };
    case "review":
      return { ...s, review: { ...s.review, ...a.patch }, sendError: undefined };
    case "sending":
      return { ...s, sending: true, sendError: undefined };
    case "sendFailed":
      return { ...s, sending: false, sendError: a.error };
    case "done":
      return { ...s, step: "done", sending: false, saved: a.monster, queued: a.queued };
    case "reset":
      return initial;
  }
}

export default function SnapPage() {
  const router = useRouter();
  const [s, dispatch] = useReducer(reducer, initial);

  async function onCapture(capture: Capture) {
    const id = crypto.randomUUID();
    dispatch({ type: "captured", capture, id });

    // address lookup runs alongside the analysis
    if (capture.location) {
      reverseGeocode(capture.location.lat, capture.location.lng)
        .then((address) => dispatch({ type: "address", address }))
        .catch(() => dispatch({ type: "address" }));
    }

    const [analysis, existing, reporter] = await Promise.all([
      analyzePhoto(capture.photo).catch((e: unknown) => e as Error),
      monsterRepo.list(),
      settings.getReporter().catch(() => undefined),
    ]);

    const duplicate = capture.location ? findNearbyDuplicate(existing, capture.location) : undefined;
    const catchPoints = duplicate ? 0 : NEW_HOUSE_POINTS;

    if (analysis instanceof Error) {
      // Claude unavailable: still hatch a monster from the photo's own colors; user writes the description.
      const palette = await samplePalette(capture.photo);
      const features = fallbackFeatures(id);
      dispatch({
        type: "analyzed",
        look: { animal: chooseAnimal(features, [], id), palette, houseFeatures: features, conditionTags: [] },
        name: "Mystery House",
        description: FALLBACK_DESCRIPTION,
        tags: [],
        note: analysis instanceof ApiError ? analysis.message : "We couldn't read the photo, so you'll describe the house yourself.",
        catchPoints,
        duplicateOf: duplicate?.name,
        reporter,
      });
      return;
    }

    if (!analysis.isHouse || analysis.confidence < 0.35) {
      dispatch({ type: "notHouse", text: analysis.isHouse ? "" : analysis.description });
      return;
    }

    dispatch({
      type: "analyzed",
      look: {
        animal: chooseAnimal(analysis.houseFeatures, analysis.conditionTags, id),
        palette: analysis.palette,
        houseFeatures: analysis.houseFeatures,
        conditionTags: analysis.conditionTags,
      },
      name: analysis.suggestedName,
      description: analysis.description,
      tags: analysis.conditionTags,
      catchPoints,
      duplicateOf: duplicate?.name,
      reporter,
    });
  }

  /** The monster record as it stands right now. */
  function buildMonster(overrides: Partial<Monster> = {}): Monster {
    const look = s.look!;
    return {
      id: s.id,
      name: s.name.trim().slice(0, MAX_NAME_LENGTH),
      animal: look.animal,
      houseFeatures: look.houseFeatures,
      palette: look.palette,
      photo: s.photo,
      location: s.review.location!,
      address: s.review.address.trim(),
      description: s.review.description.trim(),
      conditionTags: s.review.conditionTags,
      foundAt: s.foundAt,
      reportStatus: "draft",
      points: 0,
      ...overrides,
    };
  }

  async function send() {
    dispatch({ type: "sending" });
    const reporter = cleanContact(s.review.reporter);
    if (reporter) await settings.saveReporter(reporter).catch(() => {});
    // Save first as a queued draft so nothing is lost if the tab closes mid-send.
    const draft = buildMonster({ reporter, pendingReport: true, points: s.catchPoints, conditionTags: s.review.conditionTags });
    await monsterRepo.put(draft);
    try {
      const result = await sendReport(toPayload(draft));
      const reported = markReported(draft, result.reference, s.catchPoints);
      await monsterRepo.put(reported);
      dispatch({ type: "done", monster: reported, queued: false });
    } catch (e) {
      if (isRetryable(e)) {
        dispatch({ type: "done", monster: draft, queued: true });
        return;
      }
      await monsterRepo.put({ ...draft, pendingReport: false, points: 0 });
      dispatch({ type: "sendFailed", error: e instanceof Error ? e.message : "Sending failed." });
    }
  }

  async function cancel() {
    // Keep the monster as an unreported draft (no points) when we know where it is.
    if (s.review.location) {
      await monsterRepo.put(buildMonster({ address: s.review.address.trim() || formatCoords(s.review.location) }));
    }
    router.push(s.review.location ? "/collection" : "/");
  }

  switch (s.step) {
    case "camera":
      return <CameraView onCapture={onCapture} />;
    case "analyzing":
      return <Analyzing photo={s.photo} />;
    case "notHouse":
      return <NotAHouse photo={s.photo} what={s.notHouseText} onRetake={() => dispatch({ type: "reset" })} />;
    case "reveal":
      return (
        <Reveal
          photo={s.photo}
          look={s.look!}
          dances={s.dances}
          name={s.name}
          onNameChange={(name) => dispatch({ type: "name", name })}
          points={s.catchPoints}
          duplicateOf={s.duplicateOf}
          analysisNote={s.analysisNote}
          onNext={() => dispatch({ type: "goto", step: "review" })}
        />
      );
    case "review":
      return (
        <ReviewReport
          photo={s.photo}
          foundAt={s.foundAt}
          values={s.review}
          onChange={(patch) => dispatch({ type: "review", patch })}
          locationError={s.locationError}
          addressLoading={s.addressLoading}
          descriptionNote={s.analysisNote ? "AI photo analysis wasn't available. Add what you see (boarded windows, broken glass, overgrown yard…)." : undefined}
          sending={s.sending}
          error={s.sendError}
          onBack={() => dispatch({ type: "goto", step: "reveal" })}
          onSend={send}
          onCancel={cancel}
        />
      );
    case "done":
      return <Done monster={s.saved!} queued={s.queued} onSnapAnother={() => dispatch({ type: "reset" })} />;
  }
}

function cleanContact(c: ReporterContact): ReporterContact | undefined {
  const out: ReporterContact = {};
  if (c.name?.trim()) out.name = c.name.trim();
  if (c.email?.trim()) out.email = c.email.trim();
  if (c.phone?.trim()) out.phone = c.phone.trim();
  return Object.keys(out).length ? out : undefined;
}
