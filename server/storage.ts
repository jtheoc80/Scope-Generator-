import {
  users,
  proposals,
  proposalPhotos,
  cancellationFeedback,
  companies,
  companyMembers,
  invites,
  proposalViews,
  mobileJobs,
  mobileJobPhotos,
  mobileJobDrafts,
  type User,
  type UpsertUser,
  type Proposal,
  type InsertProposal,
  type ProposalPhotoRecord,
  type InsertProposalPhoto,
  type InsertCancellationFeedback,
  type CancellationFeedback,
  type Company,
  type InsertCompany,
  type CompanyMember,
  type InsertCompanyMember,
  type Invite,
  type InsertInvite,
  type ProposalView,
  type InsertProposalView,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count, inArray } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByStripeCustomerId(customerId: string): Promise<User | undefined>;
  updateUserStripeInfo(userId: string, stripeInfo: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string | null;
    isPro?: boolean;
    subscriptionPlan?: string | null;
  }): Promise<User | undefined>;
  updateCompanyProfile(userId: string, profile: {
    companyName?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyLogo?: string;
    licenseNumber?: string;
    priceMultiplier?: number;
    tradeMultipliers?: Record<string, number>;
    selectedTrades?: string[];
  }): Promise<User | undefined>;
  completeOnboarding(userId: string, data: {
    phone?: string;
    companyName?: string;
    businessSize?: string;
    referralSource?: string;
    primaryTrade?: string;
    yearsInBusiness?: number;
  }): Promise<User | undefined>;
  addProposalCredits(userId: string, credits: number, expiresAt: Date | null, sessionId?: string): Promise<{ user: User | undefined; alreadyProcessed: boolean }>;
  deductProposalCredit(userId: string): Promise<User | undefined>;
  isSessionProcessed(userId: string, sessionId: string): Promise<boolean>;
  
  // Proposal operations
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  getProposal(id: number): Promise<Proposal | undefined>;
  getProposalByPublicToken(token: string): Promise<Proposal | undefined>;
  getProposalsByUser(userId: string): Promise<Proposal[]>;
  updateProposal(id: number, userId: string, updates: Partial<InsertProposal>): Promise<Proposal | undefined>;
  deleteProposal(id: number, userId: string): Promise<boolean>;
  unlockProposal(id: number, userId: string): Promise<Proposal | undefined>;
  generatePublicToken(id: number, userId: string): Promise<Proposal | undefined>;
  acceptProposal(token: string, acceptedByName: string, acceptedByEmail: string, signature: string): Promise<Proposal | undefined>;
  countersignProposal(id: number, userId: string, signature: string): Promise<Proposal | undefined>;
  getProposalByPaymentLinkId(paymentLinkId: string): Promise<Proposal | undefined>;
  updateProposalPaymentStatus(id: number, updates: { paidAmount: number; paymentStatus: string; stripePaymentIntentId?: string }): Promise<Proposal | undefined>;
  
  // User Stripe settings
  updateUserStripeSettings(userId: string, settings: {
    userStripeSecretKey?: string | null;
    userStripeEnabled?: boolean;
  }): Promise<User | undefined>;
  
  // Notification preferences
  updateNotificationPreferences(userId: string, preferences: {
    emailNotificationsEnabled?: boolean;
    smsNotificationsEnabled?: boolean;
  }): Promise<User | undefined>;
  
  // Cancellation feedback
  saveCancellationFeedback(feedback: InsertCancellationFeedback): Promise<CancellationFeedback>;
  
  // Company/Workspace operations
  createCompany(company: InsertCompany): Promise<Company>;
  getCompany(id: number): Promise<Company | undefined>;
  getCompanyByOwner(ownerId: string): Promise<Company | undefined>;
  updateCompany(id: number, ownerId: string, updates: Partial<InsertCompany>): Promise<Company | undefined>;
  
  // Company member operations
  addCompanyMember(member: InsertCompanyMember): Promise<CompanyMember>;
  getCompanyMembers(companyId: number): Promise<(CompanyMember & { user: User })[]>;
  getCompanyMemberCount(companyId: number): Promise<number>;
  getUserCompanyMembership(userId: string): Promise<(CompanyMember & { company: Company }) | undefined>;
  updateMemberRole(companyId: number, userId: string, role: string): Promise<CompanyMember | undefined>;
  removeMember(companyId: number, userId: string): Promise<boolean>;
  
  // Invite operations
  createInvite(invite: InsertInvite): Promise<Invite>;
  getInviteByToken(token: string): Promise<(Invite & { company: Company }) | undefined>;
  getCompanyInvites(companyId: number): Promise<Invite[]>;
  acceptInvite(token: string, userId: string): Promise<CompanyMember | undefined>;
  deleteInvite(id: number, companyId: number): Promise<boolean>;
  
  // Analytics operations
  getProposalAnalytics(userId: string): Promise<{
    totalProposals: number;
    acceptedCount: number;
    acceptanceRate: number;
    avgPriceLow: number;
    avgPriceHigh: number;
    statusBreakdown: Record<string, number>;
    tradeBreakdown: Record<string, { count: number; avgPriceLow: number; avgPriceHigh: number }>;
  }>;
  
  // Proposal view tracking
  recordProposalView(proposalId: number, viewerIp?: string, userAgent?: string): Promise<ProposalView>;
  getProposalViews(proposalId: number): Promise<ProposalView[]>;
  getProposalViewStats(proposalId: number): Promise<{ viewCount: number; lastViewedAt: Date | null; uniqueViewers: number }>;
  getProposalViewStatsBulk(proposalIds: number[]): Promise<Record<number, { viewCount: number; lastViewedAt: Date | null }>>;
  
  // Market pricing usage tracking
  getMarketPricingLookups(userId: string): Promise<number>;
  incrementMarketPricingLookups(userId: string): Promise<number>;

  // ==========================================
  // Mobile Companion App: Jobs / Photos / Drafts
  // ==========================================
  createMobileJob(userId: string, job: {
    clientName: string;
    address: string;
    tradeId: string;
    tradeName?: string | null;
    jobTypeId: string;
    jobTypeName: string;
    jobSize?: number;
    jobNotes?: string | null;
    createIdempotencyKey?: string | null;
  }): Promise<typeof mobileJobs.$inferSelect>;

  getMobileJob(jobId: number, userId: string): Promise<typeof mobileJobs.$inferSelect | undefined>;

  addMobileJobPhoto(jobId: number, userId: string, photo: {
    publicUrl: string;
    kind?: string;
  }): Promise<typeof mobileJobPhotos.$inferSelect>;

  listMobileJobPhotos(jobId: number, userId: string): Promise<(typeof mobileJobPhotos.$inferSelect)[]>;

  createMobileJobDraft(jobId: number, userId: string, draft: {
    status: "pending" | "processing" | "ready" | "failed";
    payload?: unknown;
    confidence?: number | null;
    questions?: string[];
    error?: string | null;
  }): Promise<typeof mobileJobDrafts.$inferSelect>;

  getLatestMobileJobDraft(jobId: number, userId: string): Promise<typeof mobileJobDrafts.$inferSelect | undefined>;

  linkDraftToProposal(draftId: number, userId: string, proposalId: number): Promise<typeof mobileJobDrafts.$inferSelect | undefined>;

  getMobileJobByCreateIdempotencyKey(userId: string, key: string): Promise<typeof mobileJobs.$inferSelect | undefined>;

  // ==========================================
  // Proposal Photos
  // ==========================================
  addProposalPhoto(proposalId: number, userId: string, photo: Omit<InsertProposalPhoto, 'proposalId'>): Promise<ProposalPhotoRecord>;
  
  getProposalPhotos(proposalId: number, userId: string): Promise<ProposalPhotoRecord[]>;
  
  updateProposalPhoto(photoId: number, proposalId: number, userId: string, updates: Partial<InsertProposalPhoto>): Promise<ProposalPhotoRecord | undefined>;
  
  deleteProposalPhoto(photoId: number, proposalId: number, userId: string): Promise<boolean>;
  
  updateProposalPhotoCount(proposalId: number, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Proposal operations
  async createProposal(proposal: InsertProposal): Promise<Proposal> {
    const { options, ...rest } = proposal;
    const [newProposal] = await db
      .insert(proposals)
      .values({
        ...rest,
        options: options ?? {},
      } as typeof proposals.$inferInsert)
      .returning();
    return newProposal;
  }

  async getProposal(id: number): Promise<Proposal | undefined> {
    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, id));
    return proposal;
  }

  async getProposalByPublicToken(token: string): Promise<Proposal | undefined> {
    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.publicToken, token));
    return proposal;
  }

  async generatePublicToken(id: number, userId: string): Promise<Proposal | undefined> {
    const token = crypto.randomUUID();
    const [updated] = await db
      .update(proposals)
      .set({ publicToken: token, updatedAt: new Date() })
      .where(and(eq(proposals.id, id), eq(proposals.userId, userId)))
      .returning();
    return updated;
  }

  async getProposalsByUser(userId: string): Promise<Proposal[]> {
    return await db
      .select()
      .from(proposals)
      .where(eq(proposals.userId, userId))
      .orderBy(desc(proposals.createdAt));
  }

  async updateProposal(
    id: number,
    userId: string,
    updates: Partial<InsertProposal>
  ): Promise<Proposal | undefined> {
    const [updated] = await db
      .update(proposals)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(proposals.id, id), eq(proposals.userId, userId)))
      .returning();
    return updated;
  }

  async deleteProposal(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(proposals)
      .where(and(eq(proposals.id, id), eq(proposals.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async unlockProposal(id: number, userId: string): Promise<Proposal | undefined> {
    const [updated] = await db
      .update(proposals)
      .set({ isUnlocked: true, updatedAt: new Date() })
      .where(and(eq(proposals.id, id), eq(proposals.userId, userId)))
      .returning();
    return updated;
  }

  async updateUserStripeInfo(userId: string, stripeInfo: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string | null;
    isPro?: boolean;
    subscriptionPlan?: string | null;
  }): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...stripeInfo, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getSubscription(subscriptionId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`
    );
    return result.rows[0] || null;
  }

  async getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, customerId));
    return user;
  }

  async updateCompanyProfile(userId: string, profile: {
    companyName?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyLogo?: string;
    licenseNumber?: string;
    priceMultiplier?: number;
    tradeMultipliers?: Record<string, number>;
    selectedTrades?: string[];
  }): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserStripeSettings(userId: string, settings: {
    userStripeSecretKey?: string | null;
    userStripeEnabled?: boolean;
  }): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateNotificationPreferences(userId: string, preferences: {
    emailNotificationsEnabled?: boolean;
    smsNotificationsEnabled?: boolean;
  }): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...preferences, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async completeOnboarding(userId: string, data: {
    phone?: string;
    companyName?: string;
    businessSize?: string;
    referralSource?: string;
    primaryTrade?: string;
    yearsInBusiness?: number;
  }): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        ...data, 
        onboardingCompleted: true,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async addProposalCredits(userId: string, credits: number, expiresAt: Date | null, sessionId?: string): Promise<{ user: User | undefined; alreadyProcessed: boolean }> {
    if (sessionId) {
      const result = await db.execute(
        sql`
          UPDATE users 
          SET 
            proposal_credits = proposal_credits + ${credits},
            credits_expire_at = CASE 
              WHEN ${expiresAt}::timestamp IS NOT NULL AND (credits_expire_at IS NULL OR ${expiresAt}::timestamp > credits_expire_at)
              THEN ${expiresAt}::timestamp
              ELSE credits_expire_at
            END,
            processed_sessions = array_append(COALESCE(processed_sessions, ARRAY[]::text[]), ${sessionId}),
            updated_at = NOW()
          WHERE id = ${userId}
            AND (processed_sessions IS NULL OR NOT ${sessionId} = ANY(processed_sessions))
          RETURNING *
        `
      );
      
      if (result.rows.length === 0) {
        const existingUser = await this.getUser(userId);
        if (existingUser?.processedSessions?.includes(sessionId)) {
          return { user: existingUser, alreadyProcessed: true };
        }
        return { user: undefined, alreadyProcessed: false };
      }
      
      return { user: result.rows[0] as User, alreadyProcessed: false };
    }

    const existingUser = await this.getUser(userId);
    if (!existingUser) return { user: undefined, alreadyProcessed: false };

    const newCredits = (existingUser.proposalCredits || 0) + credits;
    
    const updateData: Partial<typeof users.$inferInsert> = {
      proposalCredits: newCredits,
      updatedAt: new Date(),
    };

    if (expiresAt) {
      if (!existingUser.creditsExpireAt || expiresAt > existingUser.creditsExpireAt) {
        updateData.creditsExpireAt = expiresAt;
      }
    }

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return { user, alreadyProcessed: false };
  }

  async isSessionProcessed(userId: string, sessionId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    return user?.processedSessions?.includes(sessionId) || false;
  }

  async deductProposalCredit(userId: string): Promise<User | undefined> {
    const existingUser = await this.getUser(userId);
    if (!existingUser) return undefined;
    
    if (existingUser.creditsExpireAt && new Date() > existingUser.creditsExpireAt) {
      return undefined;
    }
    
    if ((existingUser.proposalCredits || 0) < 1) {
      return undefined;
    }

    const [user] = await db
      .update(users)
      .set({ 
        proposalCredits: existingUser.proposalCredits - 1,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async saveCancellationFeedback(feedback: InsertCancellationFeedback): Promise<CancellationFeedback> {
    const [saved] = await db
      .insert(cancellationFeedback)
      .values(feedback)
      .returning();
    return saved;
  }

  async acceptProposal(token: string, acceptedByName: string, acceptedByEmail: string, signature: string): Promise<Proposal | undefined> {
    const [updated] = await db
      .update(proposals)
      .set({
        status: 'accepted',
        acceptedAt: new Date(),
        acceptedByName,
        acceptedByEmail,
        signature,
        updatedAt: new Date(),
      })
      .where(eq(proposals.publicToken, token))
      .returning();
    return updated;
  }

  async countersignProposal(id: number, userId: string, signature: string): Promise<Proposal | undefined> {
    const [updated] = await db
      .update(proposals)
      .set({
        contractorSignature: signature,
        contractorSignedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(proposals.id, id), eq(proposals.userId, userId), eq(proposals.status, 'accepted')))
      .returning();
    return updated;
  }

  async getProposalByPaymentLinkId(paymentLinkId: string): Promise<Proposal | undefined> {
    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.paymentLinkId, paymentLinkId));
    return proposal;
  }

  async updateProposalPaymentStatus(
    id: number, 
    updates: { paidAmount: number; paymentStatus: string; stripePaymentIntentId?: string }
  ): Promise<Proposal | undefined> {
    const [updated] = await db
      .update(proposals)
      .set({
        paidAmount: updates.paidAmount,
        paymentStatus: updates.paymentStatus,
        stripePaymentIntentId: updates.stripePaymentIntentId,
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, id))
      .returning();
    return updated;
  }

  // Company/Workspace operations
  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db
      .insert(companies)
      .values(company)
      .returning();
    
    // Add owner as a member with 'owner' role
    await db.insert(companyMembers).values({
      companyId: newCompany.id,
      userId: company.ownerId,
      role: 'owner',
    });
    
    return newCompany;
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id));
    return company;
  }

  async getCompanyByOwner(ownerId: string): Promise<Company | undefined> {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.ownerId, ownerId));
    return company;
  }

  async updateCompany(id: number, ownerId: string, updates: Partial<InsertCompany>): Promise<Company | undefined> {
    const [updated] = await db
      .update(companies)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(companies.id, id), eq(companies.ownerId, ownerId)))
      .returning();
    return updated;
  }

  // Company member operations
  async addCompanyMember(member: InsertCompanyMember): Promise<CompanyMember> {
    const [newMember] = await db
      .insert(companyMembers)
      .values(member)
      .returning();
    return newMember;
  }

  async getCompanyMembers(companyId: number): Promise<(CompanyMember & { user: User })[]> {
    const members = await db
      .select()
      .from(companyMembers)
      .innerJoin(users, eq(companyMembers.userId, users.id))
      .where(eq(companyMembers.companyId, companyId))
      .orderBy(companyMembers.createdAt);
    
    return members.map(row => ({
      ...row.company_members,
      user: row.users,
    }));
  }

  async getCompanyMemberCount(companyId: number): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(companyMembers)
      .where(eq(companyMembers.companyId, companyId));
    return result?.count || 0;
  }

  async getUserCompanyMembership(userId: string): Promise<(CompanyMember & { company: Company }) | undefined> {
    const [membership] = await db
      .select()
      .from(companyMembers)
      .innerJoin(companies, eq(companyMembers.companyId, companies.id))
      .where(eq(companyMembers.userId, userId));
    
    if (!membership) return undefined;
    
    return {
      ...membership.company_members,
      company: membership.companies,
    };
  }

  async updateMemberRole(companyId: number, userId: string, role: string): Promise<CompanyMember | undefined> {
    const [updated] = await db
      .update(companyMembers)
      .set({ role })
      .where(and(eq(companyMembers.companyId, companyId), eq(companyMembers.userId, userId)))
      .returning();
    return updated;
  }

  async removeMember(companyId: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(companyMembers)
      .where(and(eq(companyMembers.companyId, companyId), eq(companyMembers.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Invite operations
  async createInvite(invite: InsertInvite): Promise<Invite> {
    const [newInvite] = await db
      .insert(invites)
      .values(invite)
      .returning();
    return newInvite;
  }

  async getInviteByToken(token: string): Promise<(Invite & { company: Company }) | undefined> {
    const [result] = await db
      .select()
      .from(invites)
      .innerJoin(companies, eq(invites.companyId, companies.id))
      .where(eq(invites.token, token));
    
    if (!result) return undefined;
    
    return {
      ...result.invites,
      company: result.companies,
    };
  }

  async getCompanyInvites(companyId: number): Promise<Invite[]> {
    return await db
      .select()
      .from(invites)
      .where(and(eq(invites.companyId, companyId), sql`${invites.acceptedAt} IS NULL`))
      .orderBy(desc(invites.createdAt));
  }

  async acceptInvite(token: string, userId: string): Promise<CompanyMember | undefined> {
    const invite = await this.getInviteByToken(token);
    if (!invite || invite.acceptedAt || new Date() > invite.expiresAt) {
      return undefined;
    }

    // Mark invite as accepted
    await db
      .update(invites)
      .set({ acceptedAt: new Date() })
      .where(eq(invites.token, token));

    // Add user as company member
    const [member] = await db
      .insert(companyMembers)
      .values({
        companyId: invite.companyId,
        userId,
        role: invite.role,
      })
      .returning();

    return member;
  }

  async deleteInvite(id: number, companyId: number): Promise<boolean> {
    const result = await db
      .delete(invites)
      .where(and(eq(invites.id, id), eq(invites.companyId, companyId)))
      .returning();
    return result.length > 0;
  }

  async getProposalAnalytics(userId: string): Promise<{
    totalProposals: number;
    acceptedCount: number;
    acceptanceRate: number;
    avgPriceLow: number;
    avgPriceHigh: number;
    statusBreakdown: Record<string, number>;
    tradeBreakdown: Record<string, { count: number; avgPriceLow: number; avgPriceHigh: number }>;
  }> {
    const userProposals = await db
      .select()
      .from(proposals)
      .where(eq(proposals.userId, userId));

    const totalProposals = userProposals.length;
    const acceptedCount = userProposals.filter(p => p.status === 'accepted' || p.status === 'won').length;
    const acceptanceRate = totalProposals > 0 ? (acceptedCount / totalProposals) * 100 : 0;

    const avgPriceLow = totalProposals > 0 
      ? userProposals.reduce((sum, p) => sum + p.priceLow, 0) / totalProposals 
      : 0;
    const avgPriceHigh = totalProposals > 0 
      ? userProposals.reduce((sum, p) => sum + p.priceHigh, 0) / totalProposals 
      : 0;

    const statusBreakdown: Record<string, number> = {};
    userProposals.forEach(p => {
      statusBreakdown[p.status] = (statusBreakdown[p.status] || 0) + 1;
    });

    const tradeBreakdown: Record<string, { count: number; avgPriceLow: number; avgPriceHigh: number }> = {};
    userProposals.forEach(p => {
      if (!tradeBreakdown[p.tradeId]) {
        tradeBreakdown[p.tradeId] = { count: 0, avgPriceLow: 0, avgPriceHigh: 0 };
      }
      tradeBreakdown[p.tradeId].count++;
    });

    Object.keys(tradeBreakdown).forEach(tradeId => {
      const tradeProposals = userProposals.filter(p => p.tradeId === tradeId);
      tradeBreakdown[tradeId].avgPriceLow = tradeProposals.reduce((sum, p) => sum + p.priceLow, 0) / tradeProposals.length;
      tradeBreakdown[tradeId].avgPriceHigh = tradeProposals.reduce((sum, p) => sum + p.priceHigh, 0) / tradeProposals.length;
    });

    return {
      totalProposals,
      acceptedCount,
      acceptanceRate,
      avgPriceLow,
      avgPriceHigh,
      statusBreakdown,
      tradeBreakdown,
    };
  }

  // Enhanced analytics for business insights
  async getEnhancedProposalAnalytics(userId: string): Promise<{
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
    
    // Recent activity (last 30 days)
    recentProposals: number;
    recentWonValue: number;
    
    // Trends (last 30 days vs previous 30 days)
    trends: {
      proposalsChange: number;
      valueChange: number;
      winRateChange: number;
    };
  }> {
    const userProposals = await db
      .select()
      .from(proposals)
      .where(eq(proposals.userId, userId));

    // Get all views for user's proposals
    const proposalIds = userProposals.map(p => p.id);
    const allViews = proposalIds.length > 0 
      ? await db.select().from(proposalViews).where(inArray(proposalViews.proposalId, proposalIds))
      : [];

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Basic counts
    const totalProposals = userProposals.length;
    const sentCount = userProposals.filter(p => p.status !== 'draft').length;
    const viewedCount = userProposals.filter(p => p.status === 'viewed' || p.status === 'accepted' || p.status === 'won').length;
    const acceptedCount = userProposals.filter(p => p.status === 'accepted' || p.status === 'won').length;
    const wonCount = userProposals.filter(p => p.status === 'won').length;
    const lostCount = userProposals.filter(p => p.status === 'lost').length;

    // Rates
    const acceptanceRate = sentCount > 0 ? (acceptedCount / sentCount) * 100 : 0;
    const completedCount = wonCount + lostCount;
    const winRate = completedCount > 0 ? (wonCount / completedCount) * 100 : 0;

    // Value metrics
    const totalValueLow = userProposals.reduce((sum, p) => sum + p.priceLow, 0);
    const totalValueHigh = userProposals.reduce((sum, p) => sum + p.priceHigh, 0);
    
    const wonProposals = userProposals.filter(p => p.status === 'won');
    const wonValueLow = wonProposals.reduce((sum, p) => sum + p.priceLow, 0);
    const wonValueHigh = wonProposals.reduce((sum, p) => sum + p.priceHigh, 0);

    const avgPriceLow = totalProposals > 0 ? totalValueLow / totalProposals : 0;
    const avgPriceHigh = totalProposals > 0 ? totalValueHigh / totalProposals : 0;
    const avgWonValueLow = wonCount > 0 ? wonValueLow / wonCount : 0;
    const avgWonValueHigh = wonCount > 0 ? wonValueHigh / wonCount : 0;

    // Engagement metrics
    const totalViews = allViews.length;
    const avgViewsPerProposal = totalProposals > 0 ? totalViews / totalProposals : 0;
    const viewToAcceptRate = viewedCount > 0 ? (acceptedCount / viewedCount) * 100 : 0;

    // Time metrics
    let totalTimeToView = 0;
    let timeToViewCount = 0;
    let totalTimeToAccept = 0;
    let timeToAcceptCount = 0;

    for (const proposal of userProposals) {
      if (proposal.createdAt) {
        // Find first view
        const proposalViewsList = allViews.filter(v => v.proposalId === proposal.id);
        if (proposalViewsList.length > 0) {
          const firstView = proposalViewsList.sort((a, b) => 
            (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0)
          )[0];
          if (firstView.createdAt) {
            totalTimeToView += (firstView.createdAt.getTime() - proposal.createdAt.getTime()) / (1000 * 60 * 60);
            timeToViewCount++;
          }
        }
        
        // Time to accept
        if (proposal.acceptedAt) {
          totalTimeToAccept += (proposal.acceptedAt.getTime() - proposal.createdAt.getTime()) / (1000 * 60 * 60);
          timeToAcceptCount++;
        }
      }
    }

    const avgTimeToView = timeToViewCount > 0 ? Math.round(totalTimeToView / timeToViewCount) : null;
    const avgTimeToAccept = timeToAcceptCount > 0 ? Math.round(totalTimeToAccept / timeToAcceptCount) : null;

    // Status breakdown
    const statusBreakdown: Record<string, number> = {};
    userProposals.forEach(p => {
      statusBreakdown[p.status] = (statusBreakdown[p.status] || 0) + 1;
    });

    // Trade breakdown with win rate
    const tradeBreakdown: Record<string, { count: number; avgPriceLow: number; avgPriceHigh: number; winRate: number }> = {};
    userProposals.forEach(p => {
      if (!tradeBreakdown[p.tradeId]) {
        tradeBreakdown[p.tradeId] = { count: 0, avgPriceLow: 0, avgPriceHigh: 0, winRate: 0 };
      }
      tradeBreakdown[p.tradeId].count++;
    });

    Object.keys(tradeBreakdown).forEach(tradeId => {
      const tradeProposals = userProposals.filter(p => p.tradeId === tradeId);
      const tradeWon = tradeProposals.filter(p => p.status === 'won').length;
      const tradeLost = tradeProposals.filter(p => p.status === 'lost').length;
      const tradeCompleted = tradeWon + tradeLost;
      
      tradeBreakdown[tradeId].avgPriceLow = tradeProposals.reduce((sum, p) => sum + p.priceLow, 0) / tradeProposals.length;
      tradeBreakdown[tradeId].avgPriceHigh = tradeProposals.reduce((sum, p) => sum + p.priceHigh, 0) / tradeProposals.length;
      tradeBreakdown[tradeId].winRate = tradeCompleted > 0 ? (tradeWon / tradeCompleted) * 100 : 0;
    });

    // Recent activity (last 30 days)
    const recentProposals = userProposals.filter(p => 
      p.createdAt && p.createdAt >= thirtyDaysAgo
    ).length;
    
    const recentWonProposals = userProposals.filter(p => 
      p.status === 'won' && p.updatedAt && p.updatedAt >= thirtyDaysAgo
    );
    const recentWonValue = recentWonProposals.reduce((sum, p) => sum + Math.round((p.priceLow + p.priceHigh) / 2), 0);

    // Trends (compare last 30 days to previous 30 days)
    const last30DaysProposals = userProposals.filter(p => 
      p.createdAt && p.createdAt >= thirtyDaysAgo
    );
    const prev30DaysProposals = userProposals.filter(p => 
      p.createdAt && p.createdAt >= sixtyDaysAgo && p.createdAt < thirtyDaysAgo
    );

    const proposalsChange = prev30DaysProposals.length > 0 
      ? ((last30DaysProposals.length - prev30DaysProposals.length) / prev30DaysProposals.length) * 100
      : last30DaysProposals.length > 0 ? 100 : 0;

    const last30Value = last30DaysProposals.reduce((sum, p) => sum + Math.round((p.priceLow + p.priceHigh) / 2), 0);
    const prev30Value = prev30DaysProposals.reduce((sum, p) => sum + Math.round((p.priceLow + p.priceHigh) / 2), 0);
    const valueChange = prev30Value > 0 
      ? ((last30Value - prev30Value) / prev30Value) * 100
      : last30Value > 0 ? 100 : 0;

    const last30Won = last30DaysProposals.filter(p => p.status === 'won').length;
    const last30Completed = last30Won + last30DaysProposals.filter(p => p.status === 'lost').length;
    const last30WinRate = last30Completed > 0 ? (last30Won / last30Completed) * 100 : 0;

    const prev30Won = prev30DaysProposals.filter(p => p.status === 'won').length;
    const prev30Completed = prev30Won + prev30DaysProposals.filter(p => p.status === 'lost').length;
    const prev30WinRate = prev30Completed > 0 ? (prev30Won / prev30Completed) * 100 : 0;

    const winRateChange = last30WinRate - prev30WinRate;

    return {
      totalProposals,
      sentCount,
      viewedCount,
      acceptedCount,
      wonCount,
      lostCount,
      acceptanceRate: Math.round(acceptanceRate * 10) / 10,
      winRate: Math.round(winRate * 10) / 10,
      totalValueLow,
      totalValueHigh,
      wonValueLow,
      wonValueHigh,
      avgPriceLow: Math.round(avgPriceLow),
      avgPriceHigh: Math.round(avgPriceHigh),
      avgWonValueLow: Math.round(avgWonValueLow),
      avgWonValueHigh: Math.round(avgWonValueHigh),
      totalViews,
      avgViewsPerProposal: Math.round(avgViewsPerProposal * 10) / 10,
      viewToAcceptRate: Math.round(viewToAcceptRate * 10) / 10,
      avgTimeToView,
      avgTimeToAccept,
      statusBreakdown,
      tradeBreakdown,
      recentProposals,
      recentWonValue,
      trends: {
        proposalsChange: Math.round(proposalsChange * 10) / 10,
        valueChange: Math.round(valueChange * 10) / 10,
        winRateChange: Math.round(winRateChange * 10) / 10,
      },
    };
  }

  // Proposal view tracking
  async recordProposalView(proposalId: number, viewerIp?: string, userAgent?: string): Promise<ProposalView> {
    const [view] = await db
      .insert(proposalViews)
      .values({
        proposalId,
        viewerIp: viewerIp || null,
        userAgent: userAgent || null,
      })
      .returning();
    return view;
  }

  async getProposalViews(proposalId: number): Promise<ProposalView[]> {
    return await db
      .select()
      .from(proposalViews)
      .where(eq(proposalViews.proposalId, proposalId))
      .orderBy(desc(proposalViews.createdAt));
  }

  async getProposalViewStats(proposalId: number): Promise<{ viewCount: number; lastViewedAt: Date | null; uniqueViewers: number }> {
    const views = await db
      .select()
      .from(proposalViews)
      .where(eq(proposalViews.proposalId, proposalId))
      .orderBy(desc(proposalViews.createdAt));
    
    const uniqueIps = new Set(views.filter(v => v.viewerIp).map(v => v.viewerIp));
    
    return {
      viewCount: views.length,
      lastViewedAt: views.length > 0 ? views[0].createdAt : null,
      uniqueViewers: uniqueIps.size,
    };
  }

  async getProposalViewStatsBulk(proposalIds: number[]): Promise<Record<number, { viewCount: number; lastViewedAt: Date | null }>> {
    if (proposalIds.length === 0) return {};
    
    const views = await db
      .select()
      .from(proposalViews)
      .where(inArray(proposalViews.proposalId, proposalIds));
    
    const result: Record<number, { viewCount: number; lastViewedAt: Date | null }> = {};
    
    proposalIds.forEach(id => {
      const proposalViews = views.filter(v => v.proposalId === id);
      const sorted = proposalViews.sort((a, b) => 
        (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
      );
      result[id] = {
        viewCount: proposalViews.length,
        lastViewedAt: sorted.length > 0 ? sorted[0].createdAt : null,
      };
    });
    
    return result;
  }
  
  // Market pricing usage tracking
  async getMarketPricingLookups(userId: string): Promise<number> {
    const [user] = await db.select({ marketPricingLookups: users.marketPricingLookups })
      .from(users)
      .where(eq(users.id, userId));
    return user?.marketPricingLookups ?? 0;
  }
  
  async incrementMarketPricingLookups(userId: string): Promise<number> {
    const [user] = await db
      .update(users)
      .set({ 
        marketPricingLookups: sql`${users.marketPricingLookups} + 1`,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning({ marketPricingLookups: users.marketPricingLookups });
    return user?.marketPricingLookups ?? 0;
  }

  // ==========================================
  // Mobile Companion App: Jobs / Photos / Drafts
  // ==========================================

  async createMobileJob(userId: string, job: {
    clientName: string;
    address: string;
    tradeId: string;
    tradeName?: string | null;
    jobTypeId: string;
    jobTypeName: string;
    jobSize?: number;
    jobNotes?: string | null;
    createIdempotencyKey?: string | null;
  }): Promise<typeof mobileJobs.$inferSelect> {
    if (job.createIdempotencyKey) {
      const existing = await this.getMobileJobByCreateIdempotencyKey(userId, job.createIdempotencyKey);
      if (existing) return existing;
    }

    const [created] = await db
      .insert(mobileJobs)
      .values({
        userId,
        createIdempotencyKey: job.createIdempotencyKey ?? null,
        clientName: job.clientName,
        address: job.address,
        tradeId: job.tradeId,
        tradeName: job.tradeName ?? null,
        jobTypeId: job.jobTypeId,
        jobTypeName: job.jobTypeName,
        jobSize: job.jobSize ?? 2,
        jobNotes: job.jobNotes ?? null,
        status: "created",
      } as typeof mobileJobs.$inferInsert)
      .returning();
    return created;
  }

  async getMobileJobByCreateIdempotencyKey(userId: string, key: string): Promise<typeof mobileJobs.$inferSelect | undefined> {
    const [job] = await db
      .select()
      .from(mobileJobs)
      .where(and(eq(mobileJobs.userId, userId), eq(mobileJobs.createIdempotencyKey, key)));
    return job;
  }

  async getMobileJob(jobId: number, userId: string): Promise<typeof mobileJobs.$inferSelect | undefined> {
    const [job] = await db
      .select()
      .from(mobileJobs)
      .where(and(eq(mobileJobs.id, jobId), eq(mobileJobs.userId, userId)));
    return job;
  }

  async addMobileJobPhoto(jobId: number, userId: string, photo: {
    publicUrl: string;
    kind?: string;
  }): Promise<typeof mobileJobPhotos.$inferSelect> {
    // Ensure job belongs to user
    const job = await this.getMobileJob(jobId, userId);
    if (!job) {
      throw new Error("Job not found or access denied");
    }

    const [created] = await db
      .insert(mobileJobPhotos)
      .values({
        jobId,
        publicUrl: photo.publicUrl,
        kind: photo.kind ?? "site",
      } as typeof mobileJobPhotos.$inferInsert)
      .returning();

    await db
      .update(mobileJobs)
      .set({ status: "photos_uploaded", updatedAt: new Date() })
      .where(eq(mobileJobs.id, jobId));

    return created;
  }

  async listMobileJobPhotos(jobId: number, userId: string): Promise<(typeof mobileJobPhotos.$inferSelect)[]> {
    const job = await this.getMobileJob(jobId, userId);
    if (!job) return [];
    return await db
      .select()
      .from(mobileJobPhotos)
      .where(eq(mobileJobPhotos.jobId, jobId))
      .orderBy(desc(mobileJobPhotos.createdAt));
  }

  async createMobileJobDraft(jobId: number, userId: string, draft: {
    status: "pending" | "processing" | "ready" | "failed";
    payload?: unknown;
    confidence?: number | null;
    questions?: string[];
    error?: string | null;
  }): Promise<typeof mobileJobDrafts.$inferSelect> {
    const job = await this.getMobileJob(jobId, userId);
    if (!job) {
      throw new Error("Job not found or access denied");
    }

    const [created] = await db
      .insert(mobileJobDrafts)
      .values({
        jobId,
        status: draft.status,
        payload: draft.payload ?? null,
        confidence: draft.confidence ?? null,
        questions: draft.questions ?? [],
        error: draft.error ?? null,
      } as typeof mobileJobDrafts.$inferInsert)
      .returning();

    await db
      .update(mobileJobs)
      .set({
        status: draft.status === "ready" ? "drafted" : "drafting",
        updatedAt: new Date(),
      })
      .where(eq(mobileJobs.id, jobId));

    return created;
  }

  async getLatestMobileJobDraft(jobId: number, userId: string): Promise<typeof mobileJobDrafts.$inferSelect | undefined> {
    const job = await this.getMobileJob(jobId, userId);
    if (!job) return undefined;

    const [draft] = await db
      .select()
      .from(mobileJobDrafts)
      .where(eq(mobileJobDrafts.jobId, jobId))
      .orderBy(desc(mobileJobDrafts.createdAt))
      .limit(1);
    return draft;
  }

  async linkDraftToProposal(draftId: number, userId: string, proposalId: number): Promise<typeof mobileJobDrafts.$inferSelect | undefined> {
    // Verify draft -> job -> user ownership
    const [draft] = await db.select().from(mobileJobDrafts).where(eq(mobileJobDrafts.id, draftId));
    if (!draft) return undefined;

    const job = await this.getMobileJob(draft.jobId, userId);
    if (!job) return undefined;

    const [updated] = await db
      .update(mobileJobDrafts)
      .set({ proposalId, updatedAt: new Date() })
      .where(eq(mobileJobDrafts.id, draftId))
      .returning();

    await db
      .update(mobileJobs)
      .set({ status: "submitted", updatedAt: new Date() })
      .where(eq(mobileJobs.id, job.id));

    return updated;
  }

  // ==========================================
  // Proposal Photos
  // ==========================================
  
  async addProposalPhoto(proposalId: number, userId: string, photo: Omit<InsertProposalPhoto, 'proposalId'>): Promise<ProposalPhotoRecord> {
    // Verify proposal ownership
    const proposal = await this.getProposal(proposalId);
    if (!proposal || proposal.userId !== userId) {
      throw new Error("Proposal not found or access denied");
    }

    const [created] = await db
      .insert(proposalPhotos)
      .values({
        ...photo,
        proposalId,
      } as typeof proposalPhotos.$inferInsert)
      .returning();

    // Update photo count
    await this.updateProposalPhotoCount(proposalId, userId);

    return created;
  }

  async getProposalPhotos(proposalId: number, userId: string): Promise<ProposalPhotoRecord[]> {
    // Verify proposal ownership
    const proposal = await this.getProposal(proposalId);
    if (!proposal || proposal.userId !== userId) {
      return [];
    }

    return await db
      .select()
      .from(proposalPhotos)
      .where(eq(proposalPhotos.proposalId, proposalId))
      .orderBy(proposalPhotos.category, proposalPhotos.displayOrder);
  }

  async updateProposalPhoto(photoId: number, proposalId: number, userId: string, updates: Partial<InsertProposalPhoto>): Promise<ProposalPhotoRecord | undefined> {
    // Verify proposal ownership
    const proposal = await this.getProposal(proposalId);
    if (!proposal || proposal.userId !== userId) {
      return undefined;
    }

    const [updated] = await db
      .update(proposalPhotos)
      .set(updates)
      .where(and(
        eq(proposalPhotos.id, photoId),
        eq(proposalPhotos.proposalId, proposalId)
      ))
      .returning();

    return updated;
  }

  async deleteProposalPhoto(photoId: number, proposalId: number, userId: string): Promise<boolean> {
    // Verify proposal ownership
    const proposal = await this.getProposal(proposalId);
    if (!proposal || proposal.userId !== userId) {
      return false;
    }

    const result = await db
      .delete(proposalPhotos)
      .where(and(
        eq(proposalPhotos.id, photoId),
        eq(proposalPhotos.proposalId, proposalId)
      ))
      .returning();

    if (result.length > 0) {
      // Update photo count
      await this.updateProposalPhotoCount(proposalId, userId);
      return true;
    }
    return false;
  }

  async updateProposalPhotoCount(proposalId: number, userId: string): Promise<void> {
    const photos = await db
      .select({ count: count() })
      .from(proposalPhotos)
      .where(eq(proposalPhotos.proposalId, proposalId));

    const photoCount = photos[0]?.count ?? 0;

    await db
      .update(proposals)
      .set({ photoCount, updatedAt: new Date() })
      .where(and(
        eq(proposals.id, proposalId),
        eq(proposals.userId, userId)
      ));
  }
}

export const storage = new DatabaseStorage();
