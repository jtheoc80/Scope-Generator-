import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => ({
    expireIdx: index("IDX_session_expire").on(table.expire),
  }),
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isPro: boolean("is_pro").notNull().default(false),
  subscriptionPlan: varchar("subscription_plan", { length: 20 }), // 'pro' | 'crew' | null
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  proposalCredits: integer("proposal_credits").notNull().default(0),
  creditsExpireAt: timestamp("credits_expire_at"),
  processedSessions: text("processed_sessions").array().default([]),
  companyName: varchar("company_name"),
  companyAddress: text("company_address"),
  companyPhone: varchar("company_phone"),
  companyLogo: text("company_logo"),
  licenseNumber: varchar("license_number"),
  priceMultiplier: integer("price_multiplier").notNull().default(100),
  tradeMultipliers: jsonb("trade_multipliers").default({}), // { "bathroom": 110, "kitchen": 100, etc. }
  selectedTrades: text("selected_trades").array().default([]),
  // Onboarding data
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  phone: varchar("phone"),
  businessSize: varchar("business_size"), // solo, small_team, medium, large
  referralSource: varchar("referral_source"), // google, social, referral, other
  primaryTrade: varchar("primary_trade"),
  yearsInBusiness: integer("years_in_business"),
  // User Stripe Connect settings for payment links
  userStripeSecretKey: text("user_stripe_secret_key"), // encrypted/stored Stripe secret key
  userStripeEnabled: boolean("user_stripe_enabled").notNull().default(false),
  // Notification preferences
  emailNotificationsEnabled: boolean("email_notifications_enabled").notNull().default(true),
  smsNotificationsEnabled: boolean("sms_notifications_enabled").notNull().default(false),
  // Market pricing lookups (freemium: 3 free, then requires Pro)
  marketPricingLookups: integer("market_pricing_lookups").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Line item interface for multi-service proposals
export interface ProposalLineItem {
  id: string;
  tradeId: string;
  tradeName: string;
  jobTypeId: string;
  jobTypeName: string;
  jobSize: number;
  homeArea?: string;
  footage?: number;
  scope: string[];
  options: Record<string, boolean | string>;
  priceLow: number;
  priceHigh: number;
  estimatedDaysLow?: number;
  estimatedDaysHigh?: number;
  warranty?: string;
  exclusions?: string[];
}

// Proposals table
export const proposals = pgTable("proposals", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  clientName: varchar("client_name").notNull(),
  address: text("address").notNull(),
  // Primary trade/job for backwards compatibility and single-service proposals
  tradeId: varchar("trade_id").notNull(),
  jobTypeId: varchar("job_type_id").notNull(),
  jobTypeName: varchar("job_type_name").notNull(),
  jobSize: integer("job_size").notNull().default(2),
  scope: text("scope").array().notNull(),
  options: jsonb("options").notNull().default({}),
  priceLow: integer("price_low").notNull(),
  priceHigh: integer("price_high").notNull(),
  // Multi-service line items (null for single-service proposals)
  lineItems: jsonb("line_items").$type<ProposalLineItem[]>(),
  isMultiService: boolean("is_multi_service").notNull().default(false),
  // Aggregated timeline for multi-service
  estimatedDaysLow: integer("estimated_days_low"),
  estimatedDaysHigh: integer("estimated_days_high"),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, sent, won, lost, accepted
  isUnlocked: boolean("is_unlocked").notNull().default(false),
  publicToken: varchar("public_token").unique(),
  acceptedAt: timestamp("accepted_at"),
  acceptedByName: varchar("accepted_by_name"),
  acceptedByEmail: varchar("accepted_by_email"),
  signature: text("signature"),
  contractorSignature: text("contractor_signature"),
  contractorSignedAt: timestamp("contractor_signed_at"),
  // Payment fields
  paymentLinkId: varchar("payment_link_id"),
  paymentLinkUrl: text("payment_link_url"),
  depositPercentage: integer("deposit_percentage"), // e.g., 50 for 50%
  depositAmount: integer("deposit_amount"), // amount in cents
  paymentStatus: varchar("payment_status", { length: 20 }).default("none"), // none, pending, partial, paid
  paidAmount: integer("paid_amount").default(0), // amount paid in cents
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const proposalsRelations = relations(proposals, ({ one }) => ({
  user: one(users, {
    fields: [proposals.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  proposals: many(proposals),
}));

// Companies (workspaces) table for Crew plan
export const companies = pgTable("companies", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name").notNull(),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  seatLimit: integer("seat_limit").notNull().default(3), // included seats
  extraSeats: integer("extra_seats").notNull().default(0), // purchased extra seats
  address: text("address"),
  phone: varchar("phone"),
  logo: text("logo"),
  licenseNumber: varchar("license_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Company members table
export const companyMembers = pgTable("company_members", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull().default("member"), // owner, admin, member
  createdAt: timestamp("created_at").defaultNow(),
});

// Invites table for pending team invitations
export const invites = pgTable("invites", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  email: varchar("email").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("member"),
  token: varchar("token").notNull().unique(),
  invitedBy: varchar("invited_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Company relations
export const companiesRelations = relations(companies, ({ one, many }) => ({
  owner: one(users, {
    fields: [companies.ownerId],
    references: [users.id],
  }),
  members: many(companyMembers),
  invites: many(invites),
}));

export const companyMembersRelations = relations(companyMembers, ({ one }) => ({
  company: one(companies, {
    fields: [companyMembers.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [companyMembers.userId],
    references: [users.id],
  }),
}));

export const invitesRelations = relations(invites, ({ one }) => ({
  company: one(companies, {
    fields: [invites.companyId],
    references: [companies.id],
  }),
  inviter: one(users, {
    fields: [invites.invitedBy],
    references: [users.id],
  }),
}));

// Cancellation feedback table
export const cancellationFeedback = pgTable("cancellation_feedback", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: varchar("reason", { length: 100 }).notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Proposal views tracking table
export const proposalViews = pgTable("proposal_views", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  proposalId: integer("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
  viewerIp: varchar("viewer_ip"),
  userAgent: text("user_agent"),
  duration: integer("duration"), // time spent viewing in seconds
  createdAt: timestamp("created_at").defaultNow(),
});

export const proposalViewsRelations = relations(proposalViews, ({ one }) => ({
  proposal: one(proposals, {
    fields: [proposalViews.proposalId],
    references: [proposals.id],
  }),
}));

// ==========================================
// Database-backed Templates
// ==========================================

// Job option schema for templates
export interface TemplateJobOption {
  id: string;
  label: string;
  type: "boolean" | "select";
  choices?: { value: string; label: string; priceModifier: number; scopeAddition?: string }[];
  priceModifier?: number;
  scopeAddition?: string;
}

// Proposal templates table - stores both system and user-custom templates
export const proposalTemplates = pgTable("proposal_templates", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  // Template identification
  tradeId: varchar("trade_id", { length: 50 }).notNull(),
  tradeName: varchar("trade_name", { length: 100 }).notNull(),
  jobTypeId: varchar("job_type_id", { length: 50 }).notNull(),
  jobTypeName: varchar("job_type_name", { length: 200 }).notNull(),
  // Template content
  baseScope: jsonb("base_scope").notNull().$type<string[]>(),
  options: jsonb("options").notNull().$type<TemplateJobOption[]>(),
  basePriceLow: integer("base_price_low").notNull(),
  basePriceHigh: integer("base_price_high").notNull(),
  estimatedDaysLow: integer("estimated_days_low"),
  estimatedDaysHigh: integer("estimated_days_high"),
  warranty: text("warranty"),
  exclusions: jsonb("exclusions").$type<string[]>(),
  // Template metadata
  isDefault: boolean("is_default").notNull().default(true), // true = system template
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }), // null = system
  // Analytics
  usageCount: integer("usage_count").notNull().default(0),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  tradeJobTypeIdx: index("idx_templates_trade_job").on(table.tradeId, table.jobTypeId),
  createdByIdx: index("idx_templates_created_by").on(table.createdBy),
}));

export const proposalTemplatesRelations = relations(proposalTemplates, ({ one }) => ({
  creator: one(users, {
    fields: [proposalTemplates.createdBy],
    references: [users.id],
  }),
}));

// ==========================================
// Mobile Companion App: Jobs / Photos / Drafts
// ==========================================

export const mobileJobs = pgTable("mobile_jobs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // Idempotency for job creation (unique per user)
  createIdempotencyKey: varchar("create_idempotency_key", { length: 120 }),

  clientName: varchar("client_name").notNull(),
  address: text("address").notNull(),

  // Store trade/jobType directly to avoid tight coupling to template IDs
  tradeId: varchar("trade_id", { length: 50 }).notNull(),
  tradeName: varchar("trade_name", { length: 100 }),
  jobTypeId: varchar("job_type_id", { length: 50 }).notNull(),
  jobTypeName: varchar("job_type_name", { length: 200 }).notNull(),
  jobSize: integer("job_size").notNull().default(2),

  jobNotes: text("job_notes"),
  status: varchar("status", { length: 20 }).notNull().default("created"), // created, photos_uploaded, drafting, drafted, submitted

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userCreateIdemIdx: index("idx_mobile_jobs_user_create_idem").on(table.userId, table.createIdempotencyKey),
}));

export const mobileJobPhotos = pgTable("mobile_job_photos", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  jobId: integer("job_id").notNull().references(() => mobileJobs.id, { onDelete: "cascade" }),
  kind: varchar("kind", { length: 50 }).notNull().default("site"), // site, closeup, damage, etc.
  publicUrl: text("public_url").notNull(),
  // Vision findings (damage, measurements, materials, etc.)
  findings: jsonb("findings").$type<unknown>(),
  findingsStatus: varchar("findings_status", { length: 20 }).notNull().default("pending"), // pending, ready, failed
  analyzedAt: timestamp("analyzed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mobileJobDrafts = pgTable("mobile_job_drafts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  jobId: integer("job_id").notNull().references(() => mobileJobs.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, processing, ready, failed
  // Idempotency for draft trigger (unique per job)
  draftIdempotencyKey: varchar("draft_idempotency_key", { length: 120 }),
  // Worker fields for async processing
  attempts: integer("attempts").notNull().default(0),
  nextAttemptAt: timestamp("next_attempt_at"),
  lockedBy: varchar("locked_by", { length: 80 }),
  lockedAt: timestamp("locked_at"),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  // Pricing snapshot/version for auditability
  pricebookVersion: varchar("pricebook_version", { length: 40 }),
  pricingSnapshot: jsonb("pricing_snapshot").$type<unknown>(),
  payload: jsonb("payload").$type<unknown>(), // draft payload (lineItems, packages, questions, etc.)
  confidence: integer("confidence"), // 0-100
  questions: text("questions").array().default([]),
  error: text("error"),
  proposalId: integer("proposal_id").references(() => proposals.id, { onDelete: "set null" }),
  // Idempotency for submit (unique per job)
  submitIdempotencyKey: varchar("submit_idempotency_key", { length: 120 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  jobDraftIdemIdx: index("idx_mobile_job_drafts_job_draft_idem").on(table.jobId, table.draftIdempotencyKey),
  jobSubmitIdemIdx: index("idx_mobile_job_drafts_job_submit_idem").on(table.jobId, table.submitIdempotencyKey),
  statusNextAttemptIdx: index("idx_mobile_job_drafts_status_next_attempt").on(table.status, table.nextAttemptAt),
}));

export const mobileJobsRelations = relations(mobileJobs, ({ one, many }) => ({
  user: one(users, {
    fields: [mobileJobs.userId],
    references: [users.id],
  }),
  photos: many(mobileJobPhotos),
  drafts: many(mobileJobDrafts),
}));

export const mobileJobPhotosRelations = relations(mobileJobPhotos, ({ one }) => ({
  job: one(mobileJobs, {
    fields: [mobileJobPhotos.jobId],
    references: [mobileJobs.id],
  }),
}));

export const mobileJobDraftsRelations = relations(mobileJobDrafts, ({ one }) => ({
  job: one(mobileJobs, {
    fields: [mobileJobDrafts.jobId],
    references: [mobileJobs.id],
  }),
  proposal: one(proposals, {
    fields: [mobileJobDrafts.proposalId],
    references: [proposals.id],
  }),
}));

// ==========================================
// Business Insights / Analytics
// ==========================================

// Proposal analytics snapshots - stores daily/weekly aggregated metrics
export const proposalAnalyticsSnapshots = pgTable("proposal_analytics_snapshots", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // Time period
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  periodType: varchar("period_type", { length: 20 }).notNull(), // 'daily', 'weekly', 'monthly'
  // Proposal metrics
  totalProposals: integer("total_proposals").notNull().default(0),
  sentCount: integer("sent_count").notNull().default(0),
  viewedCount: integer("viewed_count").notNull().default(0),
  acceptedCount: integer("accepted_count").notNull().default(0),
  wonCount: integer("won_count").notNull().default(0),
  lostCount: integer("lost_count").notNull().default(0),
  // Value metrics
  totalValueLow: integer("total_value_low").notNull().default(0),
  totalValueHigh: integer("total_value_high").notNull().default(0),
  wonValueLow: integer("won_value_low").notNull().default(0),
  wonValueHigh: integer("won_value_high").notNull().default(0),
  avgPriceLow: integer("avg_price_low"),
  avgPriceHigh: integer("avg_price_high"),
  // Engagement metrics
  totalViews: integer("total_views").notNull().default(0),
  uniqueViewers: integer("unique_viewers").notNull().default(0),
  // Time metrics (in hours)
  avgTimeToView: integer("avg_time_to_view"),
  avgTimeToAccept: integer("avg_time_to_accept"),
  // Breakdowns stored as JSON
  tradeBreakdown: jsonb("trade_breakdown").$type<Record<string, { count: number; value: number }>>(),
  statusBreakdown: jsonb("status_breakdown").$type<Record<string, number>>(),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userPeriodIdx: index("idx_analytics_user_period").on(table.userId, table.periodStart, table.periodType),
}));

export const proposalAnalyticsSnapshotsRelations = relations(proposalAnalyticsSnapshots, ({ one }) => ({
  user: one(users, {
    fields: [proposalAnalyticsSnapshots.userId],
    references: [users.id],
  }),
}));

// Zod schemas for line items
export const proposalLineItemSchema = z.object({
  id: z.string(),
  tradeId: z.string(),
  tradeName: z.string(),
  jobTypeId: z.string(),
  jobTypeName: z.string(),
  jobSize: z.number().min(1).max(3),
  homeArea: z.string().optional(),
  footage: z.number().optional(),
  scope: z.array(z.string()),
  options: z.record(z.string(), z.union([z.boolean(), z.string()])),
  priceLow: z.number(),
  priceHigh: z.number(),
  estimatedDaysLow: z.number().optional(),
  estimatedDaysHigh: z.number().optional(),
  warranty: z.string().optional(),
  exclusions: z.array(z.string()).optional(),
});

// Zod schemas
export const insertProposalSchema = createInsertSchema(proposals).omit({
  createdAt: true,
  updatedAt: true,
}).extend({
  scope: z.array(z.string()),
  options: z.record(z.string(), z.union([z.boolean(), z.string()])).optional(),
  lineItems: z.array(proposalLineItemSchema).optional(),
  isMultiService: z.boolean().optional(),
  estimatedDaysLow: z.number().optional(),
  estimatedDaysHigh: z.number().optional(),
});

export const selectProposalSchema = createSelectSchema(proposals);

export const insertCancellationFeedbackSchema = z.object({
  userId: z.string(),
  reason: z.string().max(100),
  details: z.string().optional(),
});

export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type Proposal = typeof proposals.$inferSelect;
export type InsertCancellationFeedback = z.infer<typeof insertCancellationFeedbackSchema>;
export type CancellationFeedback = typeof cancellationFeedback.$inferSelect;

// Company schemas
export const insertCompanySchema = createInsertSchema(companies, {
  name: z.string().min(1),
  ownerId: z.string(),
}).pick({
  name: true,
  ownerId: true,
  stripeSubscriptionId: true,
  seatLimit: true,
  extraSeats: true,
  address: true,
  phone: true,
  logo: true,
  licenseNumber: true,
});

export const insertCompanyMemberSchema = createInsertSchema(companyMembers, {
  companyId: z.number(),
  userId: z.string(),
  role: z.string(),
}).pick({
  companyId: true,
  userId: true,
  role: true,
});

export const insertInviteSchema = createInsertSchema(invites, {
  companyId: z.number(),
  email: z.string().email(),
  token: z.string(),
  invitedBy: z.string(),
  expiresAt: z.date(),
}).pick({
  companyId: true,
  email: true,
  role: true,
  token: true,
  invitedBy: true,
  expiresAt: true,
});

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;
export type InsertCompanyMember = z.infer<typeof insertCompanyMemberSchema>;
export type CompanyMember = typeof companyMembers.$inferSelect;
export type InsertInvite = z.infer<typeof insertInviteSchema>;
export type Invite = typeof invites.$inferSelect;

// Proposal views types
export type ProposalView = typeof proposalViews.$inferSelect;
export type InsertProposalView = typeof proposalViews.$inferInsert;

// Template types
export type ProposalTemplate = typeof proposalTemplates.$inferSelect;
export type InsertProposalTemplate = typeof proposalTemplates.$inferInsert;

// Template Zod schemas
export const templateJobOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["boolean", "select"]),
  choices: z.array(z.object({
    value: z.string(),
    label: z.string(),
    priceModifier: z.number(),
    scopeAddition: z.string().optional(),
  })).optional(),
  priceModifier: z.number().optional(),
  scopeAddition: z.string().optional(),
});

export const insertTemplateSchema = createInsertSchema(proposalTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
}).extend({
  baseScope: z.array(z.string()),
  options: z.array(templateJobOptionSchema),
  exclusions: z.array(z.string()).optional(),
});

// Analytics types
export type ProposalAnalyticsSnapshot = typeof proposalAnalyticsSnapshots.$inferSelect;
export type InsertProposalAnalyticsSnapshot = typeof proposalAnalyticsSnapshots.$inferInsert;

// Enhanced analytics result type
export interface EnhancedProposalAnalytics {
  // Summary metrics
  totalProposals: number;
  sentCount: number;
  viewedCount: number;
  acceptedCount: number;
  wonCount: number;
  lostCount: number;
  acceptanceRate: number;
  winRate: number;
  
  // Value metrics
  totalValueLow: number;
  totalValueHigh: number;
  wonValueLow: number;
  wonValueHigh: number;
  avgPriceLow: number;
  avgPriceHigh: number;
  avgWonValueLow: number;
  avgWonValueHigh: number;
  
  // Engagement metrics
  totalViews: number;
  avgViewsPerProposal: number;
  viewToAcceptRate: number;
  
  // Time metrics (in hours)
  avgTimeToView: number | null;
  avgTimeToAccept: number | null;
  
  // Breakdowns
  statusBreakdown: Record<string, number>;
  tradeBreakdown: Record<string, { 
    count: number; 
    avgPriceLow: number; 
    avgPriceHigh: number;
    winRate: number;
  }>;
  
  // Trends (last 30 days vs previous 30 days)
  trends: {
    proposalsChange: number; // percentage
    valueChange: number; // percentage
    winRateChange: number; // percentage points
  };
}
