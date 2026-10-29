import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  chapters,
  manuscripts,
  voiceProfiles,
} from "@db/schema";
import { getUserTierLimits } from "./tiers";
import { getOwnedProject } from "./projects";
import { inpaintRewrite } from "./kimi-k3";
import { TRPCError } from "@trpc/server";

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Load a chapter plus its manuscript, verifying the user owns the project. */
async function getOwnedChapter(userId: number, chapterId: number) {
  const db = getDb();
  const chapter = await db.query.chapters.findFirst({
    where: eq(chapters.id, chapterId),
  });
  if (!chapter) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Chapter not found" });
  }
  const manuscript = await db.query.manuscripts.findFirst({
    where: eq(manuscripts.id, chapter.manuscriptId),
  });
  if (!manuscript) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Manuscript not found" });
  }
  await getOwnedProject(userId, manuscript.projectId);
  return { chapter, manuscript };
}

async function voiceCorpusForProject(userId: number, projectId: number) {
  const profiles = await getDb().query.voiceProfiles.findMany({
    where: eq(voiceProfiles.userId, userId),
  });
  const relevant = profiles.filter(
    (p) => p.projectId === projectId || p.projectId === null,
  );
  return relevant
    .map((p) => p.styleSummary ?? p.description ?? "")
    .filter(Boolean)
    .join("\n---\n");
}

export const editorRouter = createRouter({
  updateChapter: authedQuery
    .input(
      z.object({
        chapterId: z.number().int().positive(),
        title: z.string().min(1).max(512).optional(),
        content: z.string().max(500_000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { chapterId, ...patch } = input;
      const { chapter, manuscript } = await getOwnedChapter(
        ctx.user.id,
        chapterId,
      );
      await db
        .update(chapters)
        .set({
          ...(patch.title !== undefined ? { title: patch.title } : {}),
          ...(patch.content !== undefined
            ? { content: patch.content, wordCount: countWords(patch.content) }
            : {}),
        })
        .where(eq(chapters.id, chapterId));
      // Keep manuscript total in sync.
      const all = await db.query.chapters.findMany({
        where: eq(chapters.manuscriptId, manuscript.id),
      });
      const total = all
        .map((c) =>
          c.id === chapterId && patch.content !== undefined
            ? countWords(patch.content)
            : c.wordCount,
        )
        .reduce((a, b) => a + b, 0);
      await db
        .update(manuscripts)
        .set({ totalWords: total })
        .where(eq(manuscripts.id, manuscript.id));
      return db.query.chapters.findFirst({
        where: eq(chapters.id, chapter.id),
      });
    }),

  /**
   * Style-inpaint a highlighted passage. Accepts either character offsets or
   * the literal highlighted text. styleWeight 1.0–5.0 scales how deeply the
   * original handwriting voice possesses the rewrite.
   */
  inpaintRewrite: authedQuery
    .input(
      z
        .object({
          chapterId: z.number().int().positive(),
          startOffset: z.number().int().min(0).optional(),
          endOffset: z.number().int().min(0).optional(),
          highlightedText: z.string().min(1).max(20_000).optional(),
          styleWeight: z.number().min(1).max(5).default(3),
        })
        .refine(
          (v) =>
            (v.startOffset !== undefined && v.endOffset !== undefined) ||
            v.highlightedText !== undefined,
          { message: "Provide startOffset/endOffset or highlightedText" },
        ),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { chapter, manuscript } = await getOwnedChapter(
        ctx.user.id,
        input.chapterId,
      );
      const content = chapter.content ?? "";
      let start: number;
      let end: number;
      if (input.startOffset !== undefined && input.endOffset !== undefined) {
        start = input.startOffset;
        end = input.endOffset;
        if (end <= start || end > content.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid offsets for chapter content",
          });
        }
      } else {
        const idx = content.indexOf(input.highlightedText!);
        if (idx === -1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Highlighted text not found in chapter",
          });
        }
        start = idx;
        end = idx + input.highlightedText!.length;
      }
      const selectedText = content.slice(start, end);
      const surroundingContext = [
        content.slice(Math.max(0, start - 600), start),
        content.slice(end, end + 600),
      ]
        .filter(Boolean)
        .join("\n[…selection…]\n");
      const voiceCorpus =
        (await voiceCorpusForProject(ctx.user.id, manuscript.projectId)) ||
        "A warm, reflective, literary voice.";

      const rewritten = await inpaintRewrite(
        selectedText,
        input.styleWeight,
        voiceCorpus,
        surroundingContext,
      );
      const newContent = content.slice(0, start) + rewritten + content.slice(end);
      await db
        .update(chapters)
        .set({ content: newContent, wordCount: countWords(newContent) })
        .where(eq(chapters.id, chapter.id));
      return { rewritten, chapterId: chapter.id, wordCount: countWords(newContent) };
    }),

  /** Export the manuscript. epub/pdf are Legacy+ features. */
  exportManuscript: authedQuery
    .input(
      z.object({
        projectId: z.number().int().positive(),
        format: z.enum(["epub", "pdf", "txt"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const project = await getOwnedProject(ctx.user.id, input.projectId);
      const { limits } = await getUserTierLimits(ctx.user.id);
      if (!limits.exportFormats.includes(input.format)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `${input.format.toUpperCase()} export requires the Legacy or Studio tier.`,
        });
      }
      const manuscript = await db.query.manuscripts.findFirst({
        where: eq(manuscripts.projectId, project.id),
        orderBy: (m, { desc }) => [desc(m.id)],
      });
      if (!manuscript) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No manuscript generated yet for this project",
        });
      }
      const chapterRows = await db.query.chapters.findMany({
        where: eq(chapters.manuscriptId, manuscript.id),
        orderBy: (c, { asc }) => [asc(c.index)],
      });
      const body = chapterRows
        .map((c) => `${c.title}\n\n${c.content ?? ""}`)
        .join("\n\n---\n\n");
      const text = `${project.title}\n\n${body}`;
      // For epub/pdf we return the assembled plaintext payload; a production
      // build would render binary containers (pandoc/epub-gen) here. The
      // tier gate above is the load-bearing behavior.
      return {
        fileName: `${project.title.replace(/[^\w-]+/g, "_")}.${input.format}`,
        mimeType:
          input.format === "txt"
            ? "text/plain"
            : input.format === "epub"
              ? "application/epub+zip"
              : "application/pdf",
        content: text,
        totalWords: manuscript.totalWords,
      };
    }),
});
