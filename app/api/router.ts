import { authRouter } from "./auth-router";
import { createRouter, publicQuery } from "./middleware";
import { tiersRouter } from "./tiers";
import { projectsRouter } from "./projects";
import { voicesRouter } from "./voices";
import { generationRouter } from "./generation";
import { editorRouter } from "./editor";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  tiers: tiersRouter,
  projects: projectsRouter,
  voices: voicesRouter,
  generation: generationRouter,
  editor: editorRouter,
});

export type AppRouter = typeof appRouter;
