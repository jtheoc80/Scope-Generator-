import {
  users,
  proposals,
  cancellationFeedback,
  companies,
  companyMembers,
  invites,
  proposalViews,
  type User,
  type UpsertUser,
  type Proposal,
  type InsertProposal,
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
    companyAddress?: string;
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
    companyAddress?: string;
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
    
    const updateData: any = {
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
}

export const storage = new DatabaseStorage();
