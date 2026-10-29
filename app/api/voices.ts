import { z } from "zod";
import { and, count, eq } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { scans, voiceProfiles } from "@db/schema";
import { getUserTierLimits } from "./tiers";
import { getOwnedProject } from "./projects";
import { analyzeHandwriting } from "./kimi-k3";
import { TRPCError } from "@trpc/server";

async function getOwnedVoiceProfile(userId: number, voiceProfileId: number) {
  const profile = await getDb().query.voiceProfiles.findFirst({
    where: and(
      eq(voiceProfiles.id, voiceProfileId),
      eq(voiceProfiles.userId, userId),
    ),
  });
  if (!profile) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Voice profile not found",
    });
  }
  return profile;
}

/**
 * Fire-and-forget OCR + style analysis for a newly registered scan.
 * Updates the scan row and folds the new evidence into the profile's
 * styleSummary. Never throws into the request path.
 */
function processScanInBackground(scanId: number, fileUrl: string, mimeType: string) {
  void (async () => {
    const db = getDb();
    try {
      await db
        .update(scans)
        .set({ status: "processing" })
        .where(eq(scans.id, scanId));
      const analysis = await analyzeHandwriting([fileUrl], mimeType);
      await db
        .update(scans)
        .set({
          status: "vectorized",
          extractedText: analysis.transcription,
          layoutCues: analysis.layoutCues,
        })
        .where(eq(scans.id, scanId));

      const scan = await db.query.scans.findFirst({
        where: eq(scans.id, scanId),
      });
      if (scan && analysis.styleSummary) {
        const profile = await db.query.voiceProfiles.findFirst({
          where: eq(voiceProfiles.id, scan.voiceProfileId),
        });
        const merged = profile?.styleSummary
          ? `${profile.styleSummary}\n\n--- additional evidence ---\n${analysis.styleSummary}`
          : analysis.styleSummary;
        await db
          .update(voiceProfiles)
          .set({ styleSummary: merged.slice(0, 60_000) })
          .where(eq(voiceProfiles.id, scan.voiceProfileId));
      }
    } catch (err) {
      console.error(`[voices] scan ${scanId} analysis failed`, err);
      await db
        .update(scans)
        .set({ status: "failed" })
        .where(eq(scans.id, scanId));
    }
  })();
}

export const voicesRouter = createRouter({
  list: authedQuery.query(({ ctx }) =>
    getDb().query.voiceProfiles.findMany({
      where: eq(voiceProfiles.userId, ctx.user.id),
      orderBy: (v, { desc }) => [desc(v.createdAt)],
    }),
  ),

  get: authedQuery
    .input(z.object({ voiceProfileId: z.number().int().positive() }))
    .query(({ ctx, input }) =>
      getOwnedVoiceProfile(ctx.user.id, input.voiceProfileId),
    ),

  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().max(10_000).optional(),
        projectId: z.number().int().positive().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { tier, limits } = await getUserTierLimits(ctx.user.id);
      const [{ value: existing }] = await db
        .select({ value: count() })
        .from(voiceProfiles)
        .where(eq(voiceProfiles.userId, ctx.user.id));
      if (
        limits.maxVoiceProfiles !== null &&
        existing >= limits.maxVoiceProfiles
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            tier === "studio"
              ? "Voice profile limit reached."
              : `Your tier allows ${limits.maxVoiceProfiles} voice profile(s). Studio tier unlocks multiple voices and mixing.`,
        });
      }
      if (input.projectId) await getOwnedProject(ctx.user.id, input.projectId);
      const [{ id }] = await db
        .insert(voiceProfiles)
        .values({ ...input, userId: ctx.user.id })
        .$returningId();
      return getOwnedVoiceProfile(ctx.user.id, id);
    }),

  update: authedQuery
    .input(
      z.object({
        voiceProfileId: z.number().int().positive(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().max(10_000).optional(),
        projectId: z.number().int().positive().nullable().optional(),
        blendWeight: z.number().int().min(0).max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { voiceProfileId, ...patch } = input;
      await getOwnedVoiceProfile(ctx.user.id, voiceProfileId);
      if (patch.blendWeight !== undefined && patch.blendWeight < 100) {
        const { limits } = await getUserTierLimits(ctx.user.id);
        if (!limits.allowVoiceBlending) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Voice blending (mixing voices) is a Studio tier feature.",
          });
        }
      }
      if (patch.projectId) await getOwnedProject(ctx.user.id, patch.projectId);
      await db
        .update(voiceProfiles)
        .set(patch)
        .where(eq(voiceProfiles.id, voiceProfileId));
      return getOwnedVoiceProfile(ctx.user.id, voiceProfileId);
    }),

  remove: authedQuery
    .input(z.object({ voiceProfileId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await getOwnedVoiceProfile(ctx.user.id, input.voiceProfileId);
      await getDb()
        .delete(voiceProfiles)
        .where(eq(voiceProfiles.id, input.voiceProfileId));
      return { ok: true };
    }),

  /**
   * Register an uploaded scan (data-URL or storage path) against a voice
   * profile and kick off vision OCR + style analysis in the background.
   */
  uploadScan: authedQuery
    .input(
      z.object({
        voiceProfileId: z.number().int().positive(),
        projectId: z.number().int().positive().optional(),
        fileName: z.string().min(1).max(512),
        fileUrl: z.string().min(1).max(4_000_000),
        mimeType: z.string().min(1).max(128),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await getOwnedVoiceProfile(ctx.user.id, input.voiceProfileId);
      if (input.projectId) await getOwnedProject(ctx.user.id, input.projectId);

      const { limits } = await getUserTierLimits(ctx.user.id);
      const [{ value: existing }] = await db
        .select({ value: count() })
        .from(scans)
        .where(eq(scans.voiceProfileId, input.voiceProfileId));
      if (
        limits.maxScansPerVoiceProfile !== null &&
        existing >= limits.maxScansPerVoiceProfile
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Your tier allows at most ${limits.maxScansPerVoiceProfile} scans per voice profile.`,
        });
      }

      const [{ id }] = await db
        .insert(scans)
        .values({
          voiceProfileId: input.voiceProfileId,
          projectId: input.projectId ?? null,
          fileName: input.fileName,
          fileUrl: input.fileUrl,
          mimeType: input.mimeType,
          status: "uploaded",
        })
        .$returningId();
      processScanInBackground(id, input.fileUrl, input.mimeType);
      const scan = await db.query.scans.findFirst({ where: eq(scans.id, id) });
      return scan;
    }),

  listScans: authedQuery
    .input(z.object({ voiceProfileId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await getOwnedVoiceProfile(ctx.user.id, input.voiceProfileId);
      return getDb().query.scans.findMany({
        where: eq(scans.voiceProfileId, input.voiceProfileId),
        orderBy: (s, { desc }) => [desc(s.createdAt)],
      });
    }),
});
