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
  // Free trial: 60 days from account creation
  trialEndsAt: timestamp("trial_ends_at"),
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

// Option value type - can be boolean, string, or nested object (e.g., __mobile metadata)
export type OptionValue = boolean | string | Record<string, unknown>;

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
  options: Record<string, OptionValue>;
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
  // Source tracking (desktop vs mobile)
  source: varchar("source", { length: 20 }).notNull().default("desktop"), // desktop, mobile
  // Photo count for quick dashboard display
  photoCount: integer("photo_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Proposal Photos table - stores photos associated with proposals
export const proposalPhotos = pgTable("proposal_photos", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  proposalId: integer("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
  // Photo metadata
  publicUrl: text("public_url").notNull(),
  category: varchar("category", { length: 30 }).notNull().default("other"), // hero, existing, shower, vanity, flooring, etc.
  caption: text("caption"),
  filename: varchar("filename", { length: 255 }),
  // Order within category (lower = first)
  displayOrder: integer("display_order").notNull().default(0),
  // File metadata
  fileSize: integer("file_size"), // in bytes
  mimeType: varchar("mime_type", { length: 100 }),
  width: integer("width"),
  height: integer("height"),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  proposalIdx: index("idx_proposal_photos_proposal").on(table.proposalId),
  categoryOrderIdx: index("idx_proposal_photos_category_order").on(table.proposalId, table.category, table.displayOrder),
}));

export const proposalsRelations = relations(proposals, ({ one, many }) => ({
  user: one(users, {
    fields: [proposals.userId],
    references: [users.id],
  }),
  photos: many(proposalPhotos),
}));

export const proposalPhotosRelations = relations(proposalPhotos, ({ one }) => ({
  proposal: one(proposals, {
    fields: [proposalPhotos.proposalId],
    references: [proposals.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  proposals: many(proposals),
}));

// Proposal source options for UI
export const PROPOSAL_SOURCE_LABELS: Record<ProposalSource, string> = {
  desktop: 'Desktop',
  mobile: 'Mobile App',
};

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
  findingsStatus: varchar("findings_status", { length: 20 }).notNull().default("pending"), // pending, processing, ready, failed
  findingsError: text("findings_error"),
  findingsAttempts: integer("findings_attempts").notNull().default(0),
  findingsNextAttemptAt: timestamp("findings_next_attempt_at"),
  findingsLockedBy: varchar("findings_locked_by", { length: 80 }),
  findingsLockedAt: timestamp("findings_locked_at"),
  analyzedAt: timestamp("analyzed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  statusNextAttemptIdx: index("idx_mobile_job_photos_status_next_attempt").on(table.findingsStatus, table.findingsNextAttemptAt),
}));

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
// Market pricing cache (1build) for mobile
// ==========================================

export const onebuildPriceCache = pgTable("onebuild_price_cache", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  tradeId: varchar("trade_id", { length: 50 }).notNull(),
  zipcode: varchar("zipcode", { length: 10 }).notNull(),
  payload: jsonb("payload").$type<unknown>().notNull(),
  location: varchar("location", { length: 120 }),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
}, (table) => ({
  tradeZipIdx: index("idx_onebuild_cache_trade_zip").on(table.tradeId, table.zipcode),
  expiresIdx: index("idx_onebuild_cache_expires").on(table.expiresAt),
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

// ==========================================
// Learning System - User Behavior & Preferences
// ==========================================

/**
 * User action types for learning
 */
export const userActionTypes = [
  // Photo actions
  'photo_categorize',      // User assigns a category to a photo
  'photo_caption',         // User adds/edits a caption
  'photo_reorder',         // User reorders photos
  'photo_set_hero',        // User sets a photo as hero
  // Scope actions
  'scope_add',             // User adds a scope item
  'scope_remove',          // User removes a scope item
  'scope_edit',            // User edits a scope item
  'scope_reorder',         // User reorders scope items
  // Pricing actions
  'price_adjust',          // User adjusts price
  'price_accept_suggestion', // User accepts suggested price
  'price_reject_suggestion', // User rejects suggested price
  // Option actions
  'option_enable',         // User enables an option
  'option_disable',        // User disables an option
  'option_select',         // User selects an option value
  // Proposal actions
  'proposal_create',       // User creates a proposal
  'proposal_send',         // User sends a proposal
  'proposal_won',          // Proposal marked as won
  'proposal_lost',         // Proposal marked as lost
  // Template actions
  'template_use',          // User uses a template
  'template_customize',    // User customizes a template
] as const;

export type UserActionType = typeof userActionTypes[number];

/**
 * Log of user actions for learning
 * This is the raw event stream that feeds the learning system
 */
export const userActionLog = pgTable("user_action_log", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // Action details
  actionType: varchar("action_type", { length: 50 }).notNull(),
  // Context
  proposalId: integer("proposal_id").references(() => proposals.id, { onDelete: "set null" }),
  tradeId: varchar("trade_id", { length: 50 }),
  jobTypeId: varchar("job_type_id", { length: 50 }),
  // Geographic context
  zipcode: varchar("zipcode", { length: 10 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  neighborhood: varchar("neighborhood", { length: 100 }),
  // Action payload (flexible JSON for different action types)
  payload: jsonb("payload").$type<Record<string, unknown>>(),
  // Outcome tracking (for learning what works)
  outcomeType: varchar("outcome_type", { length: 20 }), // 'won', 'lost', 'pending', null
  outcomeValue: integer("outcome_value"), // final price if won
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userActionIdx: index("idx_user_action_log_user").on(table.userId, table.actionType),
  geoActionIdx: index("idx_user_action_log_geo").on(table.zipcode, table.actionType),
  tradeActionIdx: index("idx_user_action_log_trade").on(table.tradeId, table.jobTypeId, table.actionType),
  createdAtIdx: index("idx_user_action_log_created").on(table.createdAt),
}));

/**
 * Aggregated learned preferences per user
 * Updated periodically from userActionLog
 */
export const userLearnedPreferences = pgTable("user_learned_preferences", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // Preference category
  category: varchar("category", { length: 50 }).notNull(), // 'photo', 'scope', 'pricing', 'options'
  // Context (optional - for context-specific preferences)
  tradeId: varchar("trade_id", { length: 50 }),
  jobTypeId: varchar("job_type_id", { length: 50 }),
  zipcode: varchar("zipcode", { length: 10 }),
  // Learned data
  preferenceKey: varchar("preference_key", { length: 100 }).notNull(),
  preferenceValue: jsonb("preference_value").$type<unknown>().notNull(),
  // Confidence score (0-100) - increases with more data points
  confidence: integer("confidence").notNull().default(0),
  // Number of data points this preference is based on
  sampleCount: integer("sample_count").notNull().default(0),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userCategoryIdx: index("idx_user_prefs_user_category").on(table.userId, table.category),
  contextIdx: index("idx_user_prefs_context").on(table.userId, table.tradeId, table.jobTypeId),
  uniquePreference: index("idx_user_prefs_unique").on(
    table.userId, table.category, table.preferenceKey, table.tradeId, table.jobTypeId, table.zipcode
  ),
}));

/**
 * Geographic patterns - learned from all users in an area
 * Aggregated patterns by region/city/neighborhood
 */
export const geographicPatterns = pgTable("geographic_patterns", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  // Geographic scope (hierarchical: state > city > zipcode > neighborhood)
  geoLevel: varchar("geo_level", { length: 20 }).notNull(), // 'state', 'city', 'zipcode', 'neighborhood'
  geoValue: varchar("geo_value", { length: 100 }).notNull(), // e.g., "CA", "Los Angeles", "90210"
  parentGeoValue: varchar("parent_geo_value", { length: 100 }), // for hierarchy
  // Trade/Job context
  tradeId: varchar("trade_id", { length: 50 }),
  jobTypeId: varchar("job_type_id", { length: 50 }),
  // Pattern category
  patternType: varchar("pattern_type", { length: 50 }).notNull(),
  // Examples:
  // 'avg_price' - average pricing in this area
  // 'price_multiplier' - price multiplier vs national average
  // 'common_scope_items' - frequently used scope items
  // 'common_materials' - popular material choices
  // 'win_rate' - proposal win rate in this area
  // 'common_options' - frequently selected options
  // Learned data
  patternValue: jsonb("pattern_value").$type<unknown>().notNull(),
  // Statistics
  sampleCount: integer("sample_count").notNull().default(0),
  confidence: integer("confidence").notNull().default(0),
  // Timestamps
  lastCalculatedAt: timestamp("last_calculated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  geoPatternIdx: index("idx_geo_patterns_geo").on(table.geoLevel, table.geoValue),
  tradePatternIdx: index("idx_geo_patterns_trade").on(table.tradeId, table.jobTypeId, table.geoLevel),
  patternTypeIdx: index("idx_geo_patterns_type").on(table.patternType, table.geoLevel),
}));

/**
 * Photo categorization learning - tracks how users categorize photos
 * Used to auto-suggest categories for new photos
 */
export const photoCategorization = pgTable("photo_categorization_learning", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // Context
  tradeId: varchar("trade_id", { length: 50 }),
  jobTypeId: varchar("job_type_id", { length: 50 }),
  // Photo details (for pattern matching)
  photoOrder: integer("photo_order").notNull(), // 1st, 2nd, 3rd photo uploaded
  // What the user chose
  assignedCategory: varchar("assigned_category", { length: 30 }).notNull(),
  assignedCaption: text("assigned_caption"),
  // Was this the default or did user change it?
  wasAutoAssigned: boolean("was_auto_assigned").notNull().default(false),
  wasModified: boolean("was_modified").notNull().default(false),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userTradeIdx: index("idx_photo_cat_user_trade").on(table.userId, table.tradeId, table.jobTypeId),
  orderIdx: index("idx_photo_cat_order").on(table.photoOrder, table.assignedCategory),
}));

/**
 * Scope item patterns - tracks scope modifications by users
 */
export const scopeItemPatterns = pgTable("scope_item_patterns", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  // Context
  tradeId: varchar("trade_id", { length: 50 }).notNull(),
  jobTypeId: varchar("job_type_id", { length: 50 }).notNull(),
  zipcode: varchar("zipcode", { length: 10 }),
  // The scope item
  scopeItem: text("scope_item").notNull(),
  // Tracking
  addedCount: integer("added_count").notNull().default(0), // times users added this
  removedCount: integer("removed_count").notNull().default(0), // times users removed this
  modifiedCount: integer("modified_count").notNull().default(0), // times users edited this
  // Original vs custom
  isFromTemplate: boolean("is_from_template").notNull().default(false),
  // Outcome correlation
  wonWithItem: integer("won_with_item").notNull().default(0),
  lostWithItem: integer("lost_with_item").notNull().default(0),
  // Timestamps
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  tradeJobIdx: index("idx_scope_patterns_trade_job").on(table.tradeId, table.jobTypeId),
  geoIdx: index("idx_scope_patterns_geo").on(table.zipcode, table.tradeId),
}));

/**
 * Pricing adjustment patterns - learns pricing preferences
 */
export const pricingPatterns = pgTable("pricing_patterns", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  // User (null for aggregate patterns)
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  // Context
  tradeId: varchar("trade_id", { length: 50 }).notNull(),
  jobTypeId: varchar("job_type_id", { length: 50 }).notNull(),
  jobSize: integer("job_size"), // 1=small, 2=medium, 3=large
  zipcode: varchar("zipcode", { length: 10 }),
  // Pricing data
  suggestedPriceLow: integer("suggested_price_low"),
  suggestedPriceHigh: integer("suggested_price_high"),
  finalPriceLow: integer("final_price_low"),
  finalPriceHigh: integer("final_price_high"),
  adjustmentPercent: integer("adjustment_percent"), // how much user adjusted (+/- %)
  // Outcome
  outcome: varchar("outcome", { length: 20 }), // 'won', 'lost', 'pending'
  // Statistics (for aggregate patterns)
  sampleCount: integer("sample_count").notNull().default(1),
  avgAdjustmentPercent: integer("avg_adjustment_percent"),
  winRate: integer("win_rate"), // percentage
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userTradeIdx: index("idx_pricing_patterns_user_trade").on(table.userId, table.tradeId, table.jobTypeId),
  geoTradeIdx: index("idx_pricing_patterns_geo_trade").on(table.zipcode, table.tradeId, table.jobTypeId),
  outcomeIdx: index("idx_pricing_patterns_outcome").on(table.outcome, table.tradeId),
}));

// Relations for learning tables
export const userActionLogRelations = relations(userActionLog, ({ one }) => ({
  user: one(users, {
    fields: [userActionLog.userId],
    references: [users.id],
  }),
  proposal: one(proposals, {
    fields: [userActionLog.proposalId],
    references: [proposals.id],
  }),
}));

export const userLearnedPreferencesRelations = relations(userLearnedPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userLearnedPreferences.userId],
    references: [users.id],
  }),
}));

export const photoCategorizationRelations = relations(photoCategorization, ({ one }) => ({
  user: one(users, {
    fields: [photoCategorization.userId],
    references: [users.id],
  }),
}));

// Types for learning system
export type UserActionLog = typeof userActionLog.$inferSelect;
export type InsertUserActionLog = typeof userActionLog.$inferInsert;
export type UserLearnedPreference = typeof userLearnedPreferences.$inferSelect;
export type GeographicPattern = typeof geographicPatterns.$inferSelect;
export type PhotoCategorizationRecord = typeof photoCategorization.$inferSelect;
export type ScopeItemPattern = typeof scopeItemPatterns.$inferSelect;
export type PricingPattern = typeof pricingPatterns.$inferSelect;

// Zod schemas for line items
// Line item options can contain boolean, string, or nested objects
const lineItemOptionValueSchema: z.ZodType<boolean | string | Record<string, unknown>> = z.union([
  z.boolean(),
  z.string(),
  z.record(z.string(), z.unknown()),
]);

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
  options: z.record(z.string(), lineItemOptionValueSchema),
  priceLow: z.number(),
  priceHigh: z.number(),
  estimatedDaysLow: z.number().optional(),
  estimatedDaysHigh: z.number().optional(),
  warranty: z.string().optional(),
  exclusions: z.array(z.string()).optional(),
});

// Proposal source types
export const proposalSourceTypes = ['desktop', 'mobile'] as const;
export type ProposalSource = typeof proposalSourceTypes[number];

// Zod schemas
// Options can contain boolean, string, or nested objects (e.g., __mobile metadata)
const optionValueSchema: z.ZodType<boolean | string | Record<string, unknown>> = z.union([
  z.boolean(),
  z.string(),
  z.record(z.string(), z.unknown()),
]);

export const insertProposalSchema = createInsertSchema(proposals).omit({
  createdAt: true,
  updatedAt: true,
}).extend({
  scope: z.array(z.string()),
  options: z.record(z.string(), optionValueSchema).optional(),
  lineItems: z.array(proposalLineItemSchema).optional(),
  isMultiService: z.boolean().optional(),
  estimatedDaysLow: z.number().optional(),
  estimatedDaysHigh: z.number().optional(),
  source: z.enum(proposalSourceTypes).optional(),
  photoCount: z.number().optional(),
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

// Proposal photos types and schemas
export type ProposalPhotoRecord = typeof proposalPhotos.$inferSelect;
export type InsertProposalPhoto = typeof proposalPhotos.$inferInsert;

export const proposalPhotoCategories = [
  'hero',
  'existing',
  'shower',
  'vanity',
  'flooring',
  'tub',
  'toilet',
  'plumbing',
  'electrical',
  'damage',
  'kitchen',
  'cabinets',
  'countertops',
  'roofing',
  'siding',
  'windows',
  'hvac',
  'other',
] as const;

export type ProposalPhotoCategory = typeof proposalPhotoCategories[number];

export const insertProposalPhotoSchema = createInsertSchema(proposalPhotos).omit({
  id: true,
  createdAt: true,
}).extend({
  category: z.enum(proposalPhotoCategories).default('other'),
});

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

// ==========================================
// Customer & Address Memory (for Job Setup)
// ==========================================

/**
 * Saved customers - remembers customer info for quick job creation
 */
export const savedCustomers = pgTable("saved_customers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at").defaultNow(),
}, (table) => ({
  userIdx: index("idx_saved_customers_user").on(table.userId),
  userLastUsedIdx: index("idx_saved_customers_user_last_used").on(table.userId, table.lastUsedAt),
}));

/**
 * Saved addresses - remembers addresses for quick job creation
 * Can be linked to a customer or standalone
 */
export const savedAddresses = pgTable("saved_addresses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  customerId: integer("customer_id").references(() => savedCustomers.id, { onDelete: "set null" }),
  formatted: text("formatted").notNull(), // Full formatted address
  street: varchar("street", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zip: varchar("zip", { length: 20 }),
  placeId: varchar("place_id", { length: 255 }), // Google Places ID for deduplication
  lat: varchar("lat", { length: 20 }),
  lng: varchar("lng", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at").defaultNow(),
}, (table) => ({
  userIdx: index("idx_saved_addresses_user").on(table.userId),
  userLastUsedIdx: index("idx_saved_addresses_user_last_used").on(table.userId, table.lastUsedAt),
  customerIdx: index("idx_saved_addresses_customer").on(table.customerId),
  placeIdIdx: index("idx_saved_addresses_place_id").on(table.userId, table.placeId),
}));

/**
 * Job setup preferences - remembers last used settings
 */
export const jobSetupPreferences = pgTable("job_setup_preferences", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  lastJobType: varchar("last_job_type", { length: 50 }),
  lastCustomerId: integer("last_customer_id").references(() => savedCustomers.id, { onDelete: "set null" }),
  lastAddressId: integer("last_address_id").references(() => savedAddresses.id, { onDelete: "set null" }),
  recentJobTypes: text("recent_job_types").array().default([]), // Last 10 job types
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdx: index("idx_job_setup_prefs_user").on(table.userId),
}));

// Relations
export const savedCustomersRelations = relations(savedCustomers, ({ one, many }) => ({
  user: one(users, {
    fields: [savedCustomers.userId],
    references: [users.id],
  }),
  addresses: many(savedAddresses),
}));

export const savedAddressesRelations = relations(savedAddresses, ({ one }) => ({
  user: one(users, {
    fields: [savedAddresses.userId],
    references: [users.id],
  }),
  customer: one(savedCustomers, {
    fields: [savedAddresses.customerId],
    references: [savedCustomers.id],
  }),
}));

export const jobSetupPreferencesRelations = relations(jobSetupPreferences, ({ one }) => ({
  user: one(users, {
    fields: [jobSetupPreferences.userId],
    references: [users.id],
  }),
  lastCustomer: one(savedCustomers, {
    fields: [jobSetupPreferences.lastCustomerId],
    references: [savedCustomers.id],
  }),
  lastAddress: one(savedAddresses, {
    fields: [jobSetupPreferences.lastAddressId],
    references: [savedAddresses.id],
  }),
}));

// Types
export type SavedCustomer = typeof savedCustomers.$inferSelect;
export type InsertSavedCustomer = typeof savedCustomers.$inferInsert;
export type SavedAddress = typeof savedAddresses.$inferSelect;
export type InsertSavedAddress = typeof savedAddresses.$inferInsert;
export type JobSetupPreference = typeof jobSetupPreferences.$inferSelect;
export type InsertJobSetupPreference = typeof jobSetupPreferences.$inferInsert;

// Zod schemas
export const insertSavedCustomerSchema = createInsertSchema(savedCustomers).omit({
  id: true,
  createdAt: true,
  lastUsedAt: true,
});

export const insertSavedAddressSchema = createInsertSchema(savedAddresses).omit({
  id: true,
  createdAt: true,
  lastUsedAt: true,
});

export const insertJobSetupPreferenceSchema = createInsertSchema(jobSetupPreferences).omit({
  id: true,
  updatedAt: true,
});
