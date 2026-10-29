import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  longtext,
  timestamp,
  bigint,
  int,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── GhostWriter Studio domain model ─────────────────────────────
// FK columns referencing a serial() PK use:
//   bigint("columnName", { mode: "number", unsigned: true })

export const subscriptions = mysqlTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  tier: mysqlEnum("tier", ["memory", "legacy", "studio"])
    .default("memory")
    .notNull(),
  status: mysqlEnum("status", ["active", "trialing", "past_due", "canceled"])
    .default("active")
    .notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

export const projects = mysqlTable("projects", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  premise: text("premise"),
  genre: varchar("genre", { length: 128 }),
  status: mysqlEnum("status", ["draft", "generating", "complete", "archived"])
    .default("draft")
    .notNull(),
  targetWords: int("targetWords").default(80000).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

export const voiceProfiles = mysqlTable("voice_profiles", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  projectId: bigint("projectId", { mode: "number", unsigned: true }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  styleSummary: text("styleSummary"),
  blendWeight: int("blendWeight").default(100).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VoiceProfile = typeof voiceProfiles.$inferSelect;
export type InsertVoiceProfile = typeof voiceProfiles.$inferInsert;

export const scans = mysqlTable("scans", {
  id: serial("id").primaryKey(),
  voiceProfileId: bigint("voiceProfileId", {
    mode: "number",
    unsigned: true,
  }).notNull(),
  projectId: bigint("projectId", { mode: "number", unsigned: true }),
  fileName: varchar("fileName", { length: 512 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  extractedText: longtext("extractedText"),
  layoutCues: text("layoutCues"),
  status: mysqlEnum("status", ["uploaded", "processing", "vectorized", "failed"])
    .default("uploaded")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Scan = typeof scans.$inferSelect;
export type InsertScan = typeof scans.$inferInsert;

export const manuscripts = mysqlTable("manuscripts", {
  id: serial("id").primaryKey(),
  projectId: bigint("projectId", { mode: "number", unsigned: true }).notNull(),
  blueprintJson: longtext("blueprintJson"),
  totalWords: int("totalWords").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Manuscript = typeof manuscripts.$inferSelect;
export type InsertManuscript = typeof manuscripts.$inferInsert;

export const chapters = mysqlTable("chapters", {
  id: serial("id").primaryKey(),
  manuscriptId: bigint("manuscriptId", {
    mode: "number",
    unsigned: true,
  }).notNull(),
  index: int("index").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  content: longtext("content"),
  wordCount: int("wordCount").default(0).notNull(),
  status: mysqlEnum("status", ["queued", "writing", "done", "error"])
    .default("queued")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Chapter = typeof chapters.$inferSelect;
export type InsertChapter = typeof chapters.$inferInsert;

export const generationJobs = mysqlTable("generation_jobs", {
  id: serial("id").primaryKey(),
  projectId: bigint("projectId", { mode: "number", unsigned: true }).notNull(),
  phase: mysqlEnum("phase", [
    "blueprint",
    "swarm",
    "consistency",
    "done",
    "failed",
  ])
    .default("blueprint")
    .notNull(),
  progress: int("progress").default(0).notNull(),
  log: longtext("log"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type GenerationJob = typeof generationJobs.$inferSelect;
export type InsertGenerationJob = typeof generationJobs.$inferInsert;
