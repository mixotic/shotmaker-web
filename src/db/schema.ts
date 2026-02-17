import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

/**
 * Users
 */
export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  name: text("name"),
  passwordHash: text("password_hash"),
  avatarUrl: text("avatar_url"),
  plan: text("plan").notNull().default("free"),
  credits: integer("credits").notNull().default(50),
  storageUsed: bigint("storage_used", { mode: "number" }).notNull().default(0),
  storageLimit: bigint("storage_limit", { mode: "number" })
    .notNull()
    .default(524_288_000),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
}, (t) => ({
  emailIdx: uniqueIndex("users_email_unique").on(t.email),
}));

/**
 * NextAuth Adapter Tables
 *
 * Based on: https://authjs.dev/reference/adapter/drizzle
 */
export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.provider, t.providerAccountId] }),
    userIdIdx: index("accounts_user_id_idx").on(t.userId),
  }),
);

export const sessions = pgTable(
  "sessions",
  {
    sessionToken: text("session_token").notNull().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => ({
    sessionTokenUnique: uniqueIndex("sessions_session_token_unique").on(
      t.sessionToken,
    ),
    userIdIdx: index("sessions_user_id_idx").on(t.userId),
  }),
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.identifier, t.token] }),
  }),
);

/**
 * Projects
 */
export const projects = pgTable(
  "projects",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    projectData: jsonb("project_data").notNull().default({}),
    storageUsed: bigint("storage_used", { mode: "number" }).notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdIdx: index("projects_user_id_idx").on(t.userId),
  }),
);

/**
 * Media files (stored in Cloudflare R2)
 */
export const mediaFiles = pgTable(
  "media_files",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    draftIndex: integer("draft_index").notNull().default(0),
    imageIndex: integer("image_index").notNull().default(0),
    r2Key: text("r2_key").notNull(),
    fileType: text("file_type").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    projectIdIdx: index("media_files_project_id_idx").on(t.projectId),
    entityIdx: index("media_files_entity_idx").on(t.entityType, t.entityId),
  }),
);

/**
 * Generation log
 */
export const generationLog = pgTable(
  "generation_log",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    entityType: text("entity_type"),
    entityId: uuid("entity_id"),
    generationType: text("generation_type").notNull(),
    model: text("model"),
    creditsUsed: integer("credits_used").notNull(),
    status: text("status").notNull().default("pending"),
    errorMessage: text("error_message"),
    durationMs: integer("duration_ms"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdIdx: index("generation_log_user_id_idx").on(t.userId),
    createdAtIdx: index("generation_log_created_at_idx").on(t.createdAt),
  }),
);

/**
 * User API keys (encrypted)
 */
export const userApiKeys = pgTable(
  "user_api_keys",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull().default("google"),
    encryptedKey: text("encrypted_key").notNull(),
    keyHint: text("key_hint"),
    isValid: boolean("is_valid").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userProviderUnique: uniqueIndex("user_api_keys_user_provider_unique").on(
      t.userId,
      t.provider,
    ),
    userIdIdx: index("user_api_keys_user_id_idx").on(t.userId),
  }),
);

/**
 * Credit transactions
 */
export const creditTransactions = pgTable(
  "credit_transactions",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    reason: text("reason").notNull(),
    referenceId: text("reference_id"),
    balanceAfter: integer("balance_after").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdIdx: index("credit_transactions_user_id_idx").on(t.userId),
  }),
);

/**
 * Relations
 */
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  projects: many(projects),
  mediaFiles: many(mediaFiles),
  generationLog: many(generationLog),
  apiKeys: many(userApiKeys),
  creditTransactions: many(creditTransactions),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  mediaFiles: many(mediaFiles),
  generationLog: many(generationLog),
}));

export const mediaFilesRelations = relations(mediaFiles, ({ one }) => ({
  project: one(projects, {
    fields: [mediaFiles.projectId],
    references: [projects.id],
  }),
  user: one(users, { fields: [mediaFiles.userId], references: [users.id] }),
}));

export const generationLogRelations = relations(generationLog, ({ one }) => ({
  user: one(users, { fields: [generationLog.userId], references: [users.id] }),
  project: one(projects, {
    fields: [generationLog.projectId],
    references: [projects.id],
  }),
}));

export const userApiKeysRelations = relations(userApiKeys, ({ one }) => ({
  user: one(users, { fields: [userApiKeys.userId], references: [users.id] }),
}));

export const creditTransactionsRelations = relations(
  creditTransactions,
  ({ one }) => ({
    user: one(users, {
      fields: [creditTransactions.userId],
      references: [users.id],
    }),
  }),
);
