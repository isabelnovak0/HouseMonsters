/**
 * Shared domain types. The analysis shape is defined once (as a Zod schema in
 * analysis-schema.ts) and inferred here so the server, the client and the
 * Claude structured-output contract can never drift apart.
 */
import type { HouseAnalysis } from "./analysis-schema";

export type { HouseAnalysis, HouseFeatures, Palette } from "./analysis-schema";

/** The three animals from the reference art: turtle (detailed), snail (minimal), box cat (spooky-cute). */
export const ANIMALS = ["turtle", "snail", "boxcat"] as const;
export type AnimalType = (typeof ANIMALS)[number];

export type ReportStatus = "draft" | "reported" | "resolved";

export const MAX_NAME_LENGTH = 15;

export interface GeoPoint {
  lat: number;
  lng: number;
  /** Accuracy radius in metres when it came from GPS; absent for typed addresses. */
  accuracy?: number;
}

export interface ReporterContact {
  name?: string;
  email?: string;
  phone?: string;
}

/** One collected house monster. Persisted on-device (see storage/). */
export interface Monster {
  id: string;
  name: string;
  animal: AnimalType;
  houseFeatures: HouseAnalysis["houseFeatures"];
  palette: HouseAnalysis["palette"];
  /** JPEG data URL, already downscaled on the client. */
  photo: string;
  location: GeoPoint;
  address: string;
  description: string;
  conditionTags: string[];
  /** ISO timestamp of capture. */
  foundAt: string;
  reportStatus: ReportStatus;
  /** Reference/ticket id returned by the sender, if any. */
  reportRef?: string;
  /** ISO timestamp the report was accepted by the sender. */
  reportedAt?: string;
  /** ISO timestamp the house was marked resolved. */
  resolvedAt?: string;
  /** Points this monster has earned so far (new house + resolve bonus). */
  points: number;
  /** True while a confirmed report is waiting for the network (offline queue). */
  pendingReport?: boolean;
  /** The reporter contact captured when the user confirmed the report. */
  reporter?: ReporterContact;
}

/** What the client posts to /api/report. */
export interface ReportPayload {
  monsterId: string;
  monsterName: string;
  address: string;
  location: GeoPoint;
  foundAt: string;
  description: string;
  conditionTags: string[];
  photo: string;
  reporter?: ReporterContact;
}

export interface ReportResult {
  ok: boolean;
  /** Which sender handled it ("email", "open311"). */
  channel: string;
  reference?: string;
  error?: string;
}
