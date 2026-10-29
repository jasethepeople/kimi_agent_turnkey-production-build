/**
 * Shared GhostWriter Studio tier constants.
 * Importable by both backend routers and frontend pages.
 */

export type TierId = "memory" | "legacy" | "studio";

export interface TierLimits {
  /** Max projects the user may own. `null` = unlimited. */
  maxProjects: number | null;
  /** Max voice profiles the user may own. `null` = unlimited. */
  maxVoiceProfiles: number | null;
  /** Whether multiple voices may be blended on one project (Studio feature). */
  allowVoiceBlending: boolean;
  /** Max scans per voice profile. `null` = unlimited. */
  maxScansPerVoiceProfile: number | null;
  /** Max target words for a single generation run. */
  maxWordsPerGeneration: number;
  /** Export formats allowed for this tier. */
  exportFormats: Array<"txt" | "epub" | "pdf">;
  /** Whether the writer swarm may write chapters in parallel (Studio feature). */
  parallelSwarm: boolean;
}

export interface TierDefinition {
  id: TierId;
  name: string;
  /** Monthly price in USD. */
  priceUsd: number;
  tagline: string;
  limits: TierLimits;
}

export const TIERS: Record<TierId, TierDefinition> = {
  memory: {
    id: "memory",
    name: "Memory",
    priceUsd: 0,
    tagline: "Preserve one voice, one story.",
    limits: {
      maxProjects: 1,
      maxVoiceProfiles: 1,
      allowVoiceBlending: false,
      maxScansPerVoiceProfile: 20,
      maxWordsPerGeneration: 15_000,
      exportFormats: ["txt"],
      parallelSwarm: false,
    },
  },
  legacy: {
    id: "legacy",
    name: "Legacy",
    priceUsd: 29,
    tagline: "A full novel in their hand.",
    limits: {
      maxProjects: 5,
      maxVoiceProfiles: 3,
      allowVoiceBlending: false,
      maxScansPerVoiceProfile: 200,
      maxWordsPerGeneration: 80_000,
      exportFormats: ["txt", "epub", "pdf"],
      parallelSwarm: false,
    },
  },
  studio: {
    id: "studio",
    name: "Studio",
    priceUsd: 99,
    tagline: "A writers' room of the people you love.",
    limits: {
      maxProjects: null,
      maxVoiceProfiles: null,
      allowVoiceBlending: true,
      maxScansPerVoiceProfile: null,
      maxWordsPerGeneration: 200_000,
      exportFormats: ["txt", "epub", "pdf"],
      parallelSwarm: true,
    },
  },
} as const;

export const TIER_ORDER: TierId[] = ["memory", "legacy", "studio"];

export function tierLimits(tier: TierId): TierLimits {
  return TIERS[tier].limits;
}

/** True when `candidate` is a paid upgrade over `current`. */
export function isUpgrade(current: TierId, candidate: TierId): boolean {
  return TIER_ORDER.indexOf(candidate) > TIER_ORDER.indexOf(current);
}

/**
 * Mapping of Stripe price IDs → tiers. Populated from env in
 * `api/stripe-webhook.ts`; kept here so frontend pricing pages can display
 * the canonical price points without a backend round-trip.
 */
export const TIER_PRICE_ENV_KEYS: Record<TierId, string | null> = {
  memory: null, // free tier — no Stripe price
  legacy: "STRIPE_PRICE_LEGACY",
  studio: "STRIPE_PRICE_STUDIO",
};
