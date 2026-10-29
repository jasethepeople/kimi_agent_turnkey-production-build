# Plan — GhostWriter Studio (Production-Ready Full-Stack SaaS)

## Goal
Build a turnkey full-stack webapp from the attached brief: Kimi K3-powered novel generation from handwriting voice profiles, with tiered SaaS gating (Memory $0 / Legacy $29 / Studio $99), Stripe-ready billing, AI pipeline (vision ingestion → blueprint → writer swarm → style inpainting), and 4 UX screens (Archive Vault, Premise Studio, Generation Dashboard, Master Editor).

## Stage 1 — Skill loading & architecture
- Load `vibecoding-webapp-swarm` (+ product-knowledge.md), `webapp-building-swarm`, `backend-building-swarm`, `swarm-workspace`.
- Decide scope: frontend + full-stack backend (tRPC/Drizzle/Hono + MySQL) with auth, projects, tiers, AI pipeline service layer.

## Stage 2 — Swarm build (parallel subagents)
- Agent A (design+frontend shell): app scaffolding, routes, 4 core screens, style system (low-saturation, warm, literary).
- Agent B (backend): schema (users, subscriptions, projects, voice_profiles, scans, manuscripts, chapters, generation_jobs), tRPC routers, tier gating, Stripe webhook stubs, Kimi K3 API client service (vision ingest, blueprint agent, chapter swarm, style inpaint rewrite).
- Agent C (AI pipeline UX wiring): generation dashboard realtime progress, master editor split view, style slider inpaint flow.

## Stage 3 — Integration & validation
- Merge branches, run install + build, fix errors, verify routes render.

## Stage 4 — Delivery
- `website_version_manager` build_version (dynamic if server-backed). Deliverable note: Stripe keys / Kimi API key as env vars documented in README.
