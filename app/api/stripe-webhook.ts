/**
 * ─── STRIPE WEBHOOK (STUB — not yet active) ───────────────────────
 *
 * GhostWriter Studio currently runs in simulated/self-service billing mode
 * (see `api/tiers.ts` → upgradeTier). When Stripe is introduced, mount this
 * handler in `api/boot.ts`, e.g.:
 *
 *   app.post("/api/stripe/webhook", stripeWebhookHandler);
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY        — Stripe API secret key
 *   STRIPE_WEBHOOK_SECRET    — signing secret for this endpoint (whsec_…)
 *   STRIPE_PRICE_LEGACY      — price ID for Legacy ($29/mo)
 *   STRIPE_PRICE_STUDIO      — price ID for Studio ($99/mo)
 *   (Memory is the free $0 tier — no price ID.)
 *
 * TODO before enabling:
 *   1. `npm install stripe` and construct the client with STRIPE_SECRET_KEY.
 *   2. Read the RAW request body (Hono: `await c.req.text()` — do NOT parse
 *      JSON first) and verify the signature:
 *      `stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)`.
 *   3. Handle events:
 *        - checkout.session.completed  → link stripeCustomerId to the user
 *        - customer.subscription.created / updated → set tier + status +
 *          currentPeriodEnd from the subscription's price ID (see map below)
 *        - customer.subscription.deleted → downgrade to 'memory', status canceled
 *        - invoice.payment_failed → status past_due
 *   4. Make the handler idempotent (Stripe retries; store processed event IDs
 *      or key on stripeSubscriptionId).
 */

import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { getDb } from "./queries/connection";
import { subscriptions } from "@db/schema";
import type { TierId } from "@contracts/tiers";

/** Map Stripe price IDs → GhostWriter tiers (from env). */
export function stripePriceToTier(priceId: string): TierId | null {
  if (priceId && priceId === process.env.STRIPE_PRICE_LEGACY) return "legacy";
  if (priceId && priceId === process.env.STRIPE_PRICE_STUDIO) return "studio";
  return null;
}

/** Shared writer used by the (future) webhook and tests. */
export async function applyStripeSubscriptionUpdate(args: {
  userId: number;
  tier: TierId;
  status: "active" | "trialing" | "past_due" | "canceled";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: Date | null;
}) {
  const db = getDb();
  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, args.userId),
  });
  if (!existing) {
    await db.insert(subscriptions).values({
      userId: args.userId,
      tier: args.tier,
      status: args.status,
      stripeCustomerId: args.stripeCustomerId ?? null,
      stripeSubscriptionId: args.stripeSubscriptionId ?? null,
      currentPeriodEnd: args.currentPeriodEnd ?? null,
    });
    return;
  }
  await db
    .update(subscriptions)
    .set({
      tier: args.tier,
      status: args.status,
      ...(args.stripeCustomerId
        ? { stripeCustomerId: args.stripeCustomerId }
        : {}),
      ...(args.stripeSubscriptionId
        ? { stripeSubscriptionId: args.stripeSubscriptionId }
        : {}),
      ...(args.currentPeriodEnd !== undefined
        ? { currentPeriodEnd: args.currentPeriodEnd }
        : {}),
    })
    .where(eq(subscriptions.id, existing.id));
}

export async function stripeWebhookHandler(c: Context) {
  // TODO: verify Stripe signature before trusting the payload:
  //   const signature = c.req.header("stripe-signature");
  //   const event = stripe.webhooks.constructEvent(
  //     await c.req.text(), signature!, process.env.STRIPE_WEBHOOK_SECRET!);
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return c.json(
      { error: "Stripe webhook not configured (simulated billing mode)" },
      501,
    );
  }
  return c.json({ received: true, note: "TODO: dispatch verified events" });
}
