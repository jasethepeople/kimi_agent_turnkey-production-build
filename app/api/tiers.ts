import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { subscriptions, type Subscription } from "@db/schema";
import {
  TIERS,
  TIER_ORDER,
  tierLimits,
  type TierId,
  type TierLimits,
} from "@contracts/tiers";
import { TRPCError } from "@trpc/server";

/** Fetch the user's subscription, provisioning a free 'memory' row on first use. */
export async function getOrCreateSubscription(
  userId: number,
): Promise<Subscription> {
  const db = getDb();
  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });
  if (existing) return existing;
  const [{ id }] = await db
    .insert(subscriptions)
    .values({ userId, tier: "memory", status: "active" })
    .$returningId();
  const created = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.id, id),
  });
  if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  return created;
}

export async function getUserTierLimits(
  userId: number,
): Promise<{ subscription: Subscription; tier: TierId; limits: TierLimits }> {
  const subscription = await getOrCreateSubscription(userId);
  const tier: TierId =
    subscription.status === "canceled" ? "memory" : subscription.tier;
  return { subscription, tier, limits: tierLimits(tier) };
}

export const tiersRouter = createRouter({
  /** Current subscription + effective tier limits. */
  getMySubscription: authedQuery.query(async ({ ctx }) => {
    const { subscription, tier, limits } = await getUserTierLimits(ctx.user.id);
    return { subscription, tier, limits };
  }),

  /** Static tier catalog for the pricing page. */
  listTierLimits: authedQuery.query(() => ({
    tiers: TIER_ORDER.map((id) => TIERS[id]),
  })),

  /**
   * Simulated/self-service plan change (the platform has no Stripe yet).
   * When Stripe is wired up, the webhook in `api/stripe-webhook.ts` will own
   * tier transitions driven by real payments; this mutation remains as the
   * sandbox/self-service path.
   */
  upgradeTier: authedQuery
    .input(z.object({ tier: z.enum(["memory", "legacy", "studio"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const subscription = await getOrCreateSubscription(ctx.user.id);
      await db
        .update(subscriptions)
        .set({
          tier: input.tier,
          status: "active",
          currentPeriodEnd:
            input.tier === "memory"
              ? null
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .where(eq(subscriptions.id, subscription.id));
      const updated = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.id, subscription.id),
      });
      return { subscription: updated, limits: tierLimits(input.tier) };
    }),
});
