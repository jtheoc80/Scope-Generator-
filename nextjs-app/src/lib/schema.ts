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

// User storage table (for Clerk Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey(), // Clerk user ID
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
  tradeMultipliers: jsonb("trade_multipliers").default({}),
  selectedTrades: text("selected_trades").array().default([]),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  phone: varchar("phone"),
  businessSize: varchar("business_size"),
  referralSource: varchar("referral_source"),
  primaryTrade: varchar("primary_trade"),
  yearsInBusiness: integer("years_in_business"),
  userStripeSecretKey: text("user_stripe_secret_key"),
  userStripeEnabled: boolean("user_stripe_enabled").notNull().default(false),
  emailNotificationsEnabled: boolean("email_notifications_enabled").notNull().default(true),
  smsNotificationsEnabled: boolean("sms_notifications_enabled").notNull().default(false),
  marketPricingLookups: integer("market_pricing_lookups").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Proposals table
export const proposals = pgTable("proposals", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  clientName: varchar("client_name").notNull(),
  address: text("address").notNull(),
  tradeId: varchar("trade_id").notNull(),
  jobTypeId: varchar("job_type_id").notNull(),
  jobTypeName: varchar("job_type_name").notNull(),
  jobSize: integer("job_size").notNull().default(2),
  scope: text("scope").array().notNull(),
  options: jsonb("options").notNull().default({}),
  priceLow: integer("price_low").notNull(),
  priceHigh: integer("price_high").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  isUnlocked: boolean("is_unlocked").notNull().default(false),
  publicToken: varchar("public_token").unique(),
  acceptedAt: timestamp("accepted_at"),
  acceptedByName: varchar("accepted_by_name"),
  acceptedByEmail: varchar("accepted_by_email"),
  signature: text("signature"),
  contractorSignature: text("contractor_signature"),
  contractorSignedAt: timestamp("contractor_signed_at"),
  paymentLinkId: varchar("payment_link_id"),
  paymentLinkUrl: text("payment_link_url"),
  depositPercentage: integer("deposit_percentage"),
  depositAmount: integer("deposit_amount"),
  paymentStatus: varchar("payment_status", { length: 20 }).default("none"),
  paidAmount: integer("paid_amount").default(0),
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
  seatLimit: integer("seat_limit").notNull().default(3),
  extraSeats: integer("extra_seats").notNull().default(0),
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
  role: varchar("role", { length: 20 }).notNull().default("member"),
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
  duration: integer("duration"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const proposalViewsRelations = relations(proposalViews, ({ one }) => ({
  proposal: one(proposals, {
    fields: [proposalViews.proposalId],
    references: [proposals.id],
  }),
}));

// Zod schemas
export const insertProposalSchema = createInsertSchema(proposals).omit({
  createdAt: true,
  updatedAt: true,
}).extend({
  scope: z.array(z.string()),
  options: z.record(z.string(), z.boolean()).optional(),
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

export type ProposalView = typeof proposalViews.$inferSelect;
export type InsertProposalView = typeof proposalViews.$inferInsert;
