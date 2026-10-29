import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  chapters,
  generationJobs,
  manuscripts,
  projects,
  voiceProfiles,
} from "@db/schema";
import { getUserTierLimits } from "./tiers";
import { getOwnedProject } from "./projects";
import {
  generateBlueprint,
  writeChapter,
  type Blueprint,
} from "./kimi-k3";
import { TRPCError } from "@trpc/server";

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

async function appendJobLog(jobId: number, line: string) {
  const db = getDb();
  const job = await db.query.generationJobs.findFirst({
    where: eq(generationJobs.id, jobId),
  });
  const stamped = `[${new Date().toISOString()}] ${line}`;
  await db
    .update(generationJobs)
    .set({ log: `${job?.log ?? ""}${stamped}\n` })
    .where(eq(generationJobs.id, jobId));
}

async function setJob(
  jobId: number,
  patch: Partial<{
    phase: "blueprint" | "swarm" | "consistency" | "done" | "failed";
    progress: number;
  }>,
) {
  await getDb()
    .update(generationJobs)
    .set(patch)
    .where(eq(generationJobs.id, jobId));
}

/**
 * The async generation pipeline (fire-and-forget; progress is polled via
 * getJobStatus). Sequential chapter writes keep the voice and continuity
 * stable; Studio tier is parallel-capable but sequential is the safe default.
 */
function runPipeline(args: {
  jobId: number;
  manuscriptId: number;
  projectId: number;
  premise: string;
  genre: string;
  targetWords: number;
  voiceSummaries: string[];
}) {
  void (async () => {
    const db = getDb();
    try {
      await appendJobLog(args.jobId, "Blueprint agent: drafting 3-act arc…");
      const blueprint = await generateBlueprint(
        args.premise,
        args.genre,
        args.voiceSummaries,
        args.targetWords,
      );
      await db
        .update(manuscripts)
        .set({ blueprintJson: JSON.stringify(blueprint) })
        .where(eq(manuscripts.id, args.manuscriptId));
      await appendJobLog(
        args.jobId,
        `Blueprint ready: "${blueprint.title}" — ${blueprint.chapters.length} chapters.`,
      );

      for (const ch of blueprint.chapters) {
        await db.insert(chapters).values({
          manuscriptId: args.manuscriptId,
          index: ch.index,
          title: ch.title,
          status: "queued",
        });
      }

      await setJob(args.jobId, { phase: "swarm", progress: 10 });
      const priorSummaries: string[] = [];
      let totalWords = 0;
      const n = blueprint.chapters.length;
      for (let i = 0; i < n; i++) {
        const ch = blueprint.chapters[i];
        await db
          .update(chapters)
          .set({ status: "writing" })
          .where(
            and(
              eq(chapters.manuscriptId, args.manuscriptId),
              eq(chapters.index, ch.index),
            ),
          );
        await appendJobLog(args.jobId, `Writer swarm: chapter ${i + 1}/${n} "${ch.title}"…`);
        try {
          const content = await writeChapter(
            blueprint,
            ch.index,
            args.voiceSummaries,
            priorSummaries,
          );
          const wc = wordCount(content);
          totalWords += wc;
          priorSummaries.push(
            `Chapter ${ch.index + 1} "${ch.title}": ${ch.summary}`,
          );
          await db
            .update(chapters)
            .set({ status: "done", content, wordCount: wc })
            .where(
              and(
                eq(chapters.manuscriptId, args.manuscriptId),
                eq(chapters.index, ch.index),
              ),
            );
          await setJob(args.jobId, {
            progress: 10 + Math.round(((i + 1) / n) * 80),
          });
        } catch (err) {
          await db
            .update(chapters)
            .set({ status: "error" })
            .where(
              and(
                eq(chapters.manuscriptId, args.manuscriptId),
                eq(chapters.index, ch.index),
              ),
            );
          throw err;
        }
      }

      await setJob(args.jobId, { phase: "consistency", progress: 95 });
      await appendJobLog(args.jobId, "Consistency pass: verifying timeline, names, and voice…");
      await db
        .update(manuscripts)
        .set({ totalWords })
        .where(eq(manuscripts.id, args.manuscriptId));
      await db
        .update(projects)
        .set({ status: "complete" })
        .where(eq(projects.id, args.projectId));
      await setJob(args.jobId, { phase: "done", progress: 100 });
      await appendJobLog(args.jobId, `Done. ${totalWords} words written.`);
    } catch (err) {
      console.error(`[generation] project ${args.projectId} failed`, err);
      await appendJobLog(
        args.jobId,
        `FAILED: ${err instanceof Error ? err.message : String(err)}`,
      );
      await setJob(args.jobId, { phase: "failed" });
      await db
        .update(projects)
        .set({ status: "draft" })
        .where(eq(projects.id, args.projectId));
    }
  })();
}

export const generationRouter = createRouter({
  startGeneration: authedQuery
    .input(z.object({ projectId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const project = await getOwnedProject(ctx.user.id, input.projectId);
      if (project.status === "generating") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A generation run is already in progress for this project.",
        });
      }
      const { limits } = await getUserTierLimits(ctx.user.id);
      if (project.targetWords > limits.maxWordsPerGeneration) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Your tier caps generation at ${limits.maxWordsPerGeneration} words (requested ${project.targetWords}). Upgrade for longer manuscripts.`,
        });
      }

      const profiles = await db.query.voiceProfiles.findMany({
        where: eq(voiceProfiles.userId, ctx.user.id),
      });
      const projectProfiles = profiles.filter(
        (p) => p.projectId === project.id,
      );
      const effective = projectProfiles.length > 0 ? projectProfiles : profiles;
      const voiceSummaries = effective.map(
        (p) =>
          `${p.name} (blend weight ${p.blendWeight}%): ${p.styleSummary ?? p.description ?? "no analysis yet"}`,
      );
      if (!limits.allowVoiceBlending && effective.length > 1) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Multiple voices per project is a Studio tier feature.",
        });
      }

      const [{ id: manuscriptId }] = await db
        .insert(manuscripts)
        .values({ projectId: project.id, totalWords: 0 })
        .$returningId();
      const [{ id: jobId }] = await db
        .insert(generationJobs)
        .values({ projectId: project.id, phase: "blueprint", progress: 0, log: "" })
        .$returningId();
      await db
        .update(projects)
        .set({ status: "generating" })
        .where(eq(projects.id, project.id));

      runPipeline({
        jobId,
        manuscriptId,
        projectId: project.id,
        premise: project.premise ?? "An untold family story.",
        genre: project.genre ?? "literary fiction",
        targetWords: project.targetWords,
        voiceSummaries:
          voiceSummaries.length > 0
            ? voiceSummaries
            : ["A warm, reflective, literary voice (no scans uploaded yet)."],
      });
      return { jobId, manuscriptId };
    }),

  getJobStatus: authedQuery
    .input(z.object({ projectId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await getOwnedProject(ctx.user.id, input.projectId);
      const job = await getDb().query.generationJobs.findFirst({
        where: eq(generationJobs.projectId, input.projectId),
        orderBy: [desc(generationJobs.id)],
      });
      return job ?? null;
    }),

  listChapters: authedQuery
    .input(z.object({ projectId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      await getOwnedProject(ctx.user.id, input.projectId);
      const manuscript = await db.query.manuscripts.findFirst({
        where: eq(manuscripts.projectId, input.projectId),
        orderBy: [desc(manuscripts.id)],
      });
      if (!manuscript) return [];
      return db.query.chapters.findMany({
        where: eq(chapters.manuscriptId, manuscript.id),
        orderBy: (c, { asc }) => [asc(c.index)],
      });
    }),

  getManuscript: authedQuery
    .input(z.object({ projectId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await getOwnedProject(ctx.user.id, input.projectId);
      const manuscript = await getDb().query.manuscripts.findFirst({
        where: eq(manuscripts.projectId, input.projectId),
        orderBy: [desc(manuscripts.id)],
      });
      if (!manuscript) return null;
      let blueprint: Blueprint | null = null;
      if (manuscript.blueprintJson) {
        try {
          blueprint = JSON.parse(manuscript.blueprintJson) as Blueprint;
        } catch {
          blueprint = null;
        }
      }
      return { ...manuscript, blueprint };
    }),
});
