import {
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
  // Optional structured scope sections (preferred for display when present)
  scopeSections: jsonb("scope_sections").$type<Array<{ title: string; items: string[] }>>(),
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
  scopeSections: z.array(z.object({ title: z.string(), items: z.array(z.string()) })).optional(),
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
});

/**
 * Saved addresses - remembers addresses for quick job creation
 */
export const savedAddresses = pgTable("saved_addresses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  customerId: integer("customer_id").references(() => savedCustomers.id, { onDelete: "set null" }),
  formatted: text("formatted").notNull(),
  street: varchar("street", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zip: varchar("zip", { length: 20 }),
  placeId: varchar("place_id", { length: 255 }),
  lat: varchar("lat", { length: 20 }),
  lng: varchar("lng", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at").defaultNow(),
});

/**
 * Job setup preferences - remembers last used settings
 */
export const jobSetupPreferences = pgTable("job_setup_preferences", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  lastJobType: varchar("last_job_type", { length: 50 }),
  lastCustomerId: integer("last_customer_id").references(() => savedCustomers.id, { onDelete: "set null" }),
  lastAddressId: integer("last_address_id").references(() => savedAddresses.id, { onDelete: "set null" }),
  recentJobTypes: text("recent_job_types").array().default([]),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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

// ==========================================
// EagleView Roof Orders (for Roofing Measurements)
// ==========================================

/**
 * EagleView roof measurement orders
 * Tracks order status from creation through completion
 * Stores normalized roofing measurements for proposal generation
 */
export const eagleviewRoofOrders = pgTable("eagleview_roof_orders", {
  id: varchar("id").primaryKey(), // UUID
  jobId: varchar("job_id").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  address: text("address").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("created"), // created|queued|processing|completed|failed
  eagleviewOrderId: varchar("eagleview_order_id", { length: 100 }).unique(),
  eagleviewReportId: varchar("eagleview_report_id", { length: 100 }),
  reportUrl: text("report_url"),
  payloadJson: jsonb("payload_json"),
  roofingMeasurements: jsonb("roofing_measurements"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const eagleviewRoofOrdersRelations = relations(eagleviewRoofOrders, ({ one }) => ({
  user: one(users, {
    fields: [eagleviewRoofOrders.userId],
    references: [users.id],
  }),
}));

// Types
export type EagleviewRoofOrder = typeof eagleviewRoofOrders.$inferSelect;
export type InsertEagleviewRoofOrder = typeof eagleviewRoofOrders.$inferInsert;

// Roofing measurements structure (normalized from EagleView report)
export type RoofingMeasurements = {
  squares: number;          // Total roof squares (1 square = 100 sq ft)
  roofAreaSqFt: number;     // Total roof area in square feet
  pitchBreakdown: Array<{   // Areas by pitch
    pitch: string;          // e.g., "4/12", "6/12"
    areaSqFt: number;
  }>;
  ridgesFt: number;         // Linear feet of ridges
  hipsFt: number;           // Linear feet of hips
  valleysFt: number;        // Linear feet of valleys
  eavesFt: number;          // Linear feet of eaves
  rakesFt: number;          // Linear feet of rakes
  flashingFt?: number;      // Linear feet of flashing
  dripEdgeFt?: number;      // Linear feet of drip edge
  stepFlashingFt?: number;  // Linear feet of step flashing
  facets?: number;          // Number of roof facets
  stories?: number;         // Number of stories
  predominantPitch?: string;// Most common pitch
};

// Zod schemas for validation
export const insertEagleviewRoofOrderSchema = createInsertSchema(eagleviewRoofOrders).omit({
  createdAt: true,
  updatedAt: true,
});

export const roofingMeasurementsSchema = z.object({
  squares: z.number(),
  roofAreaSqFt: z.number(),
  pitchBreakdown: z.array(z.object({
    pitch: z.string(),
    areaSqFt: z.number(),
  })),
  ridgesFt: z.number(),
  hipsFt: z.number(),
  valleysFt: z.number(),
  eavesFt: z.number(),
  rakesFt: z.number(),
  flashingFt: z.number().optional(),
  dripEdgeFt: z.number().optional(),
  stepFlashingFt: z.number().optional(),
  facets: z.number().optional(),
  stories: z.number().optional(),
  predominantPitch: z.string().optional(),
});
