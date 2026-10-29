import { z } from "zod";
import { and, count, eq, ne } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { projects } from "@db/schema";
import { getUserTierLimits } from "./tiers";
import { TRPCError } from "@trpc/server";

async function getOwnedProject(userId: number, projectId: number) {
  const project = await getDb().query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, userId)),
  });
  if (!project) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
  }
  return project;
}

export { getOwnedProject };

export const projectsRouter = createRouter({
  list: authedQuery.query(({ ctx }) =>
    getDb().query.projects.findMany({
      where: and(
        eq(projects.userId, ctx.user.id),
        ne(projects.status, "archived"),
      ),
      orderBy: (p, { desc }) => [desc(p.updatedAt)],
    }),
  ),

  get: authedQuery
    .input(z.object({ projectId: z.number().int().positive() }))
    .query(({ ctx, input }) => getOwnedProject(ctx.user.id, input.projectId)),

  create: authedQuery
    .input(
      z.object({
        title: z.string().min(1).max(255),
        premise: z.string().max(20_000).optional(),
        genre: z.string().max(128).optional(),
        targetWords: z.number().int().min(500).max(500_000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { limits } = await getUserTierLimits(ctx.user.id);
      const [{ value: existing }] = await db
        .select({ value: count() })
        .from(projects)
        .where(
          and(eq(projects.userId, ctx.user.id), ne(projects.status, "archived")),
        );
      if (limits.maxProjects !== null && existing >= limits.maxProjects) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Your tier allows at most ${limits.maxProjects} active project(s). Upgrade to create more.`,
        });
      }
      const targetWords = input.targetWords ?? 80_000;
      if (targetWords > limits.maxWordsPerGeneration) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Your tier caps generation at ${limits.maxWordsPerGeneration} words.`,
        });
      }
      const [{ id }] = await db
        .insert(projects)
        .values({ ...input, targetWords, userId: ctx.user.id })
        .$returningId();
      return getOwnedProject(ctx.user.id, id);
    }),

  update: authedQuery
    .input(
      z.object({
        projectId: z.number().int().positive(),
        title: z.string().min(1).max(255).optional(),
        premise: z.string().max(20_000).optional(),
        genre: z.string().max(128).optional(),
        targetWords: z.number().int().min(500).max(500_000).optional(),
        status: z.enum(["draft", "generating", "complete", "archived"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { projectId, ...patch } = input;
      await getOwnedProject(ctx.user.id, projectId);
      if (patch.targetWords !== undefined) {
        const { limits } = await getUserTierLimits(ctx.user.id);
        if (patch.targetWords > limits.maxWordsPerGeneration) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Your tier caps generation at ${limits.maxWordsPerGeneration} words.`,
          });
        }
      }
      await db.update(projects).set(patch).where(eq(projects.id, projectId));
      return getOwnedProject(ctx.user.id, projectId);
    }),

  remove: authedQuery
    .input(z.object({ projectId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await getOwnedProject(ctx.user.id, input.projectId);
      await getDb()
        .update(projects)
        .set({ status: "archived" })
        .where(eq(projects.id, input.projectId));
      return { ok: true };
    }),
});
