import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProposalSchema, insertCancellationFeedbackSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { stripeService } from "./stripeService";
import { getStripePublishableKey } from "./stripeClient";
import { emailService } from "./emailService";
import { aiService } from "./aiService";
import { benchmarkTrades, regionalMultipliers } from "./benchmark-data";
import { oneBuildService } from "./services/onebuild";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // 301 Redirect from scopeproposer.com to scopegenerator.com (avoid duplicate content)
  app.use((req, res, next) => {
    const host = req.get('host') || '';
    if (host.includes('scopeproposer.com')) {
      const redirectUrl = `https://scopegenerator.com${req.originalUrl}`;
      return res.redirect(301, redirectUrl);
    }
    next();
  });

  // Auth middleware
  await setupAuth(app);

  // Sitemap endpoint for SEO
  app.get('/sitemap.xml', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const today = new Date().toISOString().split('T')[0];
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/app</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/dashboard</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/settings</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;
    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  });

  // 1build widget API key (embedded key with referrer restrictions - for widget only)
  app.get('/api/onebuild-key', (req, res) => {
    const key = process.env.ONEBUILD_API_KEY || '';
    res.json({ key });
  });

  // Constants for market pricing freemium
  const FREE_PRICING_LOOKUPS = 3;
  
  // 1build External API - Cost Data Routes (server-side only, key never exposed)
  app.get('/api/costs/status', (req, res) => {
    res.json({ 
      available: oneBuildService.isConfigured(),
      message: oneBuildService.isConfigured() 
        ? "1build cost data API is available" 
        : "1build external API key not configured"
    });
  });
  
  // Get remaining market pricing lookups for current user
  app.get('/api/costs/usage', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const lookupCount = user.marketPricingLookups || 0;
      const remaining = Math.max(0, FREE_PRICING_LOOKUPS - lookupCount);
      
      res.json({
        used: lookupCount,
        remaining: user.isPro ? -1 : remaining, // -1 means unlimited for Pro users
        limit: FREE_PRICING_LOOKUPS,
        isPro: user.isPro || false,
        hasAccess: user.isPro || remaining > 0
      });
    } catch (error) {
      console.error("Error fetching usage:", error);
      res.status(500).json({ message: "Failed to fetch usage" });
    }
  });

  app.get('/api/costs/search', async (req, res) => {
    try {
      if (!oneBuildService.isConfigured()) {
        return res.status(503).json({ message: "Cost data service not configured" });
      }

      const { term, zipcode, type } = req.query;
      
      if (!term || !zipcode) {
        return res.status(400).json({ message: "term and zipcode are required" });
      }

      const sourceType = type as "MATERIAL" | "LABOR" | "EQUIPMENT" | "ASSEMBLY" | undefined;
      
      const result = await oneBuildService.searchSources(
        term as string,
        zipcode as string,
        sourceType
      );

      res.json(result);
    } catch (error) {
      console.error("Error searching costs:", error);
      res.status(500).json({ message: "Failed to search costs" });
    }
  });

  app.get('/api/costs/material', async (req, res) => {
    try {
      if (!oneBuildService.isConfigured()) {
        return res.status(503).json({ message: "Cost data service not configured" });
      }

      const { name, zipcode } = req.query;
      
      if (!name || !zipcode) {
        return res.status(400).json({ message: "name and zipcode are required" });
      }

      const result = await oneBuildService.getMaterialCost(
        name as string,
        zipcode as string
      );

      if (result) {
        res.json(result);
      } else {
        res.status(404).json({ message: "Material not found" });
      }
    } catch (error) {
      console.error("Error fetching material cost:", error);
      res.status(500).json({ message: "Failed to fetch material cost" });
    }
  });

  app.get('/api/costs/labor', async (req, res) => {
    try {
      if (!oneBuildService.isConfigured()) {
        return res.status(503).json({ message: "Cost data service not configured" });
      }

      const { type, zipcode } = req.query;
      
      if (!type || !zipcode) {
        return res.status(400).json({ message: "type and zipcode are required" });
      }

      const result = await oneBuildService.getLaborRate(
        type as string,
        zipcode as string
      );

      if (result) {
        res.json(result);
      } else {
        res.status(404).json({ message: "Labor rate not found" });
      }
    } catch (error) {
      console.error("Error fetching labor rate:", error);
      res.status(500).json({ message: "Failed to fetch labor rate" });
    }
  });

  app.get('/api/costs/trade', async (req: any, res) => {
    try {
      if (!oneBuildService.isConfigured()) {
        return res.status(503).json({ message: "Cost data service not configured" });
      }

      const { trade, zipcode } = req.query;
      
      if (!trade || !zipcode) {
        return res.status(400).json({ message: "trade and zipcode are required" });
      }
      
      // Check if user is authenticated
      const isLoggedIn = req.isAuthenticated() && req.user?.claims?.sub;
      
      if (isLoggedIn) {
        // Check usage limits for authenticated non-Pro users
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        const lookupCount = user.marketPricingLookups || 0;
        
        // Free users limited to 3 lookups (Pro users have unlimited)
        if (!user.isPro && lookupCount >= FREE_PRICING_LOOKUPS) {
          return res.status(403).json({ 
            message: "Free lookup limit reached",
            limitReached: true,
            used: lookupCount,
            limit: FREE_PRICING_LOOKUPS
          });
        }

        const result = await oneBuildService.getTradePricing(
          trade as string,
          zipcode as string
        );
        
        // Only increment usage for free users after successful lookup
        // Pro users have unlimited access, so we don't track their usage
        if (!user.isPro) {
          await storage.incrementMarketPricingLookups(userId);
        }

        res.json(result);
      } else {
        // Anonymous user - let client-side handle usage tracking via localStorage
        // Server just returns the data with an _anonymous flag
        const result = await oneBuildService.getTradePricing(
          trade as string,
          zipcode as string
        );
        
        res.json({ ...result, _anonymous: true });
      }
    } catch (error) {
      console.error("Error fetching trade pricing:", error);
      res.status(500).json({ message: "Failed to fetch trade pricing" });
    }
  });

  // Robots.txt for SEO
  app.get('/robots.txt', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard
Disallow: /settings

Sitemap: ${baseUrl}/sitemap.xml`;
    res.header('Content-Type', 'text/plain');
    res.send(robots);
  });

  // AI Scope Enhancement endpoint
  app.post('/api/ai/enhance-scope', isAuthenticated, async (req: any, res) => {
    try {
      const { jobTypeName, baseScope, clientName, address, jobNotes } = req.body;

      if (!jobTypeName || !baseScope || !Array.isArray(baseScope)) {
        return res.status(400).json({ message: "jobTypeName and baseScope array are required" });
      }

      const enhancedScope = await aiService.enhanceScope({
        jobTypeName,
        baseScope,
        clientName,
        address,
        jobNotes,
      });

      res.json({ enhancedScope });
    } catch (error) {
      console.error("Error enhancing scope:", error);
      res.status(500).json({ message: "Failed to enhance scope" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user) {
        const { userStripeSecretKey, ...safeUser } = user;
        const hasStripeKey = !!userStripeSecretKey;
        res.json({ ...safeUser, hasStripeKey });
      } else {
        res.json(null);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Company profile routes
  app.patch('/api/profile/company', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { companyName, companyAddress, companyPhone, companyLogo, licenseNumber, priceMultiplier, tradeMultipliers, selectedTrades } = req.body;
      
      // Validate priceMultiplier is within valid range (25-200)
      let validatedPriceMultiplier = priceMultiplier;
      if (priceMultiplier !== undefined) {
        if (typeof priceMultiplier !== 'number' || priceMultiplier < 25 || priceMultiplier > 200) {
          return res.status(400).json({ message: "Price multiplier must be a number between 25 and 200" });
        }
        validatedPriceMultiplier = Math.round(priceMultiplier);
      }
      
      // Validate tradeMultipliers if provided
      let validatedTradeMultipliers = tradeMultipliers;
      if (tradeMultipliers !== undefined && typeof tradeMultipliers === 'object') {
        validatedTradeMultipliers = {};
        for (const [tradeId, multiplier] of Object.entries(tradeMultipliers)) {
          if (typeof multiplier === 'number' && multiplier >= 50 && multiplier <= 150) {
            validatedTradeMultipliers[tradeId] = Math.round(multiplier);
          }
        }
      }
      
      const user = await storage.updateCompanyProfile(userId, {
        companyName,
        companyAddress,
        companyPhone,
        companyLogo,
        licenseNumber,
        priceMultiplier: validatedPriceMultiplier,
        tradeMultipliers: validatedTradeMultipliers,
        selectedTrades,
      });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error updating company profile:", error);
      res.status(500).json({ message: "Failed to update company profile" });
    }
  });

  // User Stripe settings route
  app.patch('/api/profile/stripe', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { userStripeSecretKey, userStripeEnabled } = req.body;
      
      const trimmedKey = userStripeSecretKey?.trim() || null;
      
      if (trimmedKey) {
        if (typeof trimmedKey !== 'string' || !trimmedKey.startsWith('sk_live_')) {
          return res.status(400).json({ 
            message: "Invalid Stripe secret key format. Please use a live key starting with sk_live_" 
          });
        }
      }
      
      // Get existing user to check if they already have a key
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Determine if user has a valid key (new or existing)
      const hasKey = !!trimmedKey || !!existingUser.userStripeSecretKey;
      
      const user = await storage.updateUserStripeSettings(userId, {
        // Only update key if a new one was provided
        userStripeSecretKey: trimmedKey !== null ? trimmedKey : undefined,
        // Enable only if user has a key (new or existing)
        userStripeEnabled: hasKey ? (userStripeEnabled ?? false) : false,
      });
      
      if (!user) {
        return res.status(404).json({ message: "Failed to update settings" });
      }

      const { userStripeSecretKey: _, ...safeUser } = user;
      const hasStripeKey = !!user.userStripeSecretKey;
      res.json({ ...safeUser, hasStripeKey });
    } catch (error) {
      console.error("Error updating Stripe settings:", error);
      res.status(500).json({ message: "Failed to update Stripe settings" });
    }
  });

  // Notification preferences route
  app.patch('/api/profile/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { emailNotificationsEnabled, smsNotificationsEnabled } = req.body;
      
      // Coerce and validate - handle both boolean and string values
      const preferences: { emailNotificationsEnabled?: boolean; smsNotificationsEnabled?: boolean } = {};
      
      if (emailNotificationsEnabled !== undefined) {
        preferences.emailNotificationsEnabled = emailNotificationsEnabled === true || emailNotificationsEnabled === 'true';
      }
      if (smsNotificationsEnabled !== undefined) {
        preferences.smsNotificationsEnabled = smsNotificationsEnabled === true || smsNotificationsEnabled === 'true';
      }
      
      const user = await storage.updateNotificationPreferences(userId, preferences);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { userStripeSecretKey, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      res.status(500).json({ message: "Failed to update notification preferences" });
    }
  });

  // Onboarding route
  app.post('/api/onboarding', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { phone, companyName, companyAddress, businessSize, referralSource, primaryTrade, yearsInBusiness } = req.body;
      
      // Validate required fields
      if (!companyName || !companyAddress || !primaryTrade) {
        return res.status(400).json({ message: "Company name, address, and primary trade are required" });
      }
      
      const user = await storage.completeOnboarding(userId, {
        phone,
        companyName,
        companyAddress,
        businessSize,
        referralSource,
        primaryTrade,
        yearsInBusiness: yearsInBusiness ? parseInt(yearsInBusiness) : undefined,
      });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  // Public proposal route (no auth required)
  app.get('/api/public/proposal/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }

      const proposal = await storage.getProposalByPublicToken(token);
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }

      // Record view (non-blocking)
      const viewerIp = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0] || undefined;
      const userAgent = req.headers['user-agent'] || undefined;
      storage.recordProposalView(proposal.id, viewerIp, userAgent).catch(err => 
        console.error("Error recording proposal view:", err)
      );

      // Update proposal status to 'viewed' if currently 'sent'
      if (proposal.status === 'sent') {
        storage.updateProposal(proposal.id, proposal.userId, { status: 'viewed' }).catch(err =>
          console.error("Error updating proposal status to viewed:", err)
        );
      }

      const user = await storage.getUser(proposal.userId);
      
      res.json({
        proposal: {
          id: proposal.id,
          clientName: proposal.clientName,
          address: proposal.address,
          jobTypeName: proposal.jobTypeName,
          scope: proposal.scope,
          priceLow: proposal.priceLow,
          priceHigh: proposal.priceHigh,
          options: proposal.options,
          status: proposal.status,
          acceptedAt: proposal.acceptedAt,
          acceptedByName: proposal.acceptedByName,
          acceptedByEmail: proposal.acceptedByEmail,
          signature: proposal.signature,
          contractorSignature: proposal.contractorSignature,
          contractorSignedAt: proposal.contractorSignedAt,
        },
        companyInfo: user ? {
          companyName: user.companyName,
          companyAddress: user.companyAddress,
          companyPhone: user.companyPhone,
          companyLogo: user.companyLogo,
        } : null,
      });
    } catch (error) {
      console.error("Error fetching public proposal:", error);
      res.status(500).json({ message: "Failed to fetch proposal" });
    }
  });

  // Accept proposal endpoint (no auth required - public)
  app.post('/api/public/proposal/:token/accept', async (req, res) => {
    try {
      const { token } = req.params;
      const { name, email, signature } = req.body;

      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ message: "Name is required" });
      }

      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ message: "Valid email is required" });
      }

      if (!signature || typeof signature !== 'string' || !signature.startsWith('data:image/')) {
        return res.status(400).json({ message: "Signature is required" });
      }

      if (signature.length < 1000) {
        return res.status(400).json({ message: "Please provide a valid signature" });
      }

      const proposal = await storage.getProposalByPublicToken(token);
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }

      if (proposal.status === 'accepted') {
        return res.status(400).json({ 
          message: "This proposal has already been accepted",
          acceptedAt: proposal.acceptedAt,
          acceptedByName: proposal.acceptedByName
        });
      }

      const acceptedProposal = await storage.acceptProposal(token, name.trim(), email.trim(), signature);
      if (!acceptedProposal) {
        return res.status(500).json({ message: "Failed to accept proposal" });
      }

      const user = await storage.getUser(proposal.userId);
      if (user?.email && user.emailNotificationsEnabled !== false) {
        try {
          await emailService.sendProposalAcceptedNotification({
            contractorEmail: user.email,
            contractorName: user.firstName || user.companyName || undefined,
            clientName: acceptedProposal.clientName,
            clientEmail: email.trim(),
            acceptedByName: name.trim(),
            projectTitle: acceptedProposal.jobTypeName || 'Project',
            projectAddress: acceptedProposal.address || undefined,
            totalPrice: Math.round((acceptedProposal.priceLow + acceptedProposal.priceHigh) / 2),
            acceptedAt: acceptedProposal.acceptedAt!,
          });
        } catch (emailError) {
          console.error("Error sending acceptance notification email:", emailError);
        }
      }

      res.json({
        message: "Proposal accepted successfully",
        acceptedAt: acceptedProposal.acceptedAt,
        acceptedByName: acceptedProposal.acceptedByName,
      });
    } catch (error) {
      console.error("Error accepting proposal:", error);
      res.status(500).json({ message: "Failed to accept proposal" });
    }
  });

  // Email connection test route
  app.get('/api/email/test', isAuthenticated, async (req: any, res) => {
    try {
      const result = await emailService.testConnection();
      res.json(result);
    } catch (error) {
      console.error("Error testing email connection:", error);
      res.status(500).json({ success: false, error: "Failed to test connection" });
    }
  });

  // Email proposal route
  app.post('/api/proposals/:id/email', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const proposalId = parseInt(req.params.id);
      const { recipientEmail, recipientName, message } = req.body;

      if (!recipientEmail) {
        return res.status(400).json({ message: "Recipient email is required" });
      }

      let proposal = await storage.getProposal(proposalId);
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }

      if (proposal.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!proposal.publicToken) {
        proposal = await storage.generatePublicToken(proposalId, userId) || proposal;
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const proposalUrl = proposal.publicToken ? `${baseUrl}/p/${proposal.publicToken}` : undefined;

      const totalPrice = Math.round((proposal.priceLow + proposal.priceHigh) / 2);
      
      const emailResult = await emailService.sendProposalEmail({
        recipientEmail,
        recipientName,
        proposalTitle: proposal.jobTypeName || 'Project',
        clientName: proposal.clientName,
        totalPrice,
        senderName: user.firstName || undefined,
        senderCompany: user.companyName || undefined,
        customMessage: message,
        proposalUrl,
      });

      if (!emailResult.success) {
        return res.status(500).json({ 
          message: "Failed to send email", 
          error: emailResult.error 
        });
      }

      await storage.updateProposal(proposalId, userId, { status: 'sent' });

      res.json({ 
        message: "Proposal sent successfully",
        sentTo: recipientEmail,
        messageId: emailResult.messageId
      });
    } catch (error) {
      console.error("Error sending proposal email:", error);
      res.status(500).json({ message: "Failed to send proposal" });
    }
  });

  // Contractor countersign route
  app.post('/api/proposals/:id/countersign', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const proposalId = parseInt(req.params.id);
      const { signature } = req.body;

      if (!signature || typeof signature !== 'string' || !signature.startsWith('data:image/')) {
        return res.status(400).json({ message: "Valid signature is required" });
      }

      if (signature.length < 1000) {
        return res.status(400).json({ message: "Please provide a valid signature" });
      }

      const proposal = await storage.getProposal(proposalId);
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }

      if (proposal.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (proposal.status !== 'accepted') {
        return res.status(400).json({ message: "Proposal must be accepted by client before countersigning" });
      }

      if (proposal.contractorSignature) {
        return res.status(400).json({ message: "Proposal has already been countersigned" });
      }

      const countersignedProposal = await storage.countersignProposal(proposalId, userId, signature);
      if (!countersignedProposal) {
        return res.status(500).json({ message: "Failed to countersign proposal" });
      }

      // Send completed proposal email to client
      if (countersignedProposal.acceptedByEmail) {
        const user = await storage.getUser(userId);
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const proposalUrl = countersignedProposal.publicToken ? `${baseUrl}/p/${countersignedProposal.publicToken}` : undefined;

        try {
          await emailService.sendCompletedProposalToClient({
            clientEmail: countersignedProposal.acceptedByEmail,
            clientName: countersignedProposal.clientName,
            contractorName: user?.firstName || undefined,
            contractorCompany: user?.companyName || undefined,
            projectTitle: countersignedProposal.jobTypeName || 'Project',
            projectAddress: countersignedProposal.address || undefined,
            totalPrice: Math.round((countersignedProposal.priceLow + countersignedProposal.priceHigh) / 2),
            acceptedAt: countersignedProposal.acceptedAt!,
            contractorSignedAt: countersignedProposal.contractorSignedAt!,
            proposalUrl,
          });
        } catch (emailError) {
          console.error("Error sending completed proposal email:", emailError);
        }
      }

      res.json({
        message: "Proposal countersigned successfully",
        contractorSignedAt: countersignedProposal.contractorSignedAt,
      });
    } catch (error) {
      console.error("Error countersigning proposal:", error);
      res.status(500).json({ message: "Failed to countersign proposal" });
    }
  });

  // Proposal routes
  app.post('/api/proposals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validationResult = insertProposalSchema.safeParse({
        ...req.body,
        userId,
      });

      if (!validationResult.success) {
        const error = fromZodError(validationResult.error);
        return res.status(400).json({ message: error.message });
      }

      const proposal = await storage.createProposal(validationResult.data);
      res.json(proposal);
    } catch (error) {
      console.error("Error creating proposal:", error);
      res.status(500).json({ message: "Failed to create proposal" });
    }
  });

  app.get('/api/proposals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const proposals = await storage.getProposalsByUser(userId);
      
      // Get view stats for all proposals
      const proposalIds = proposals.map(p => p.id);
      const viewStats = await storage.getProposalViewStatsBulk(proposalIds);
      
      // Merge view stats into proposals
      const proposalsWithViews = proposals.map(p => ({
        ...p,
        viewCount: viewStats[p.id]?.viewCount || 0,
        lastViewedAt: viewStats[p.id]?.lastViewedAt || null,
      }));
      
      res.json(proposalsWithViews);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      res.status(500).json({ message: "Failed to fetch proposals" });
    }
  });

  app.get('/api/proposals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const proposalId = parseInt(req.params.id);
      const proposal = await storage.getProposal(proposalId);

      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }

      if (proposal.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(proposal);
    } catch (error) {
      console.error("Error fetching proposal:", error);
      res.status(500).json({ message: "Failed to fetch proposal" });
    }
  });

  app.patch('/api/proposals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const proposalId = parseInt(req.params.id);
      
      const updated = await storage.updateProposal(proposalId, userId, req.body);
      
      if (!updated) {
        return res.status(404).json({ message: "Proposal not found or access denied" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating proposal:", error);
      res.status(500).json({ message: "Failed to update proposal" });
    }
  });

  app.delete('/api/proposals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const proposalId = parseInt(req.params.id);
      
      const deleted = await storage.deleteProposal(proposalId, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Proposal not found or access denied" });
      }

      res.json({ message: "Proposal deleted successfully" });
    } catch (error) {
      console.error("Error deleting proposal:", error);
      res.status(500).json({ message: "Failed to delete proposal" });
    }
  });

  app.post('/api/proposals/:id/unlock', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const proposalId = parseInt(req.params.id);
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const proposal = await storage.getProposal(proposalId);
      if (!proposal || proposal.userId !== userId) {
        return res.status(404).json({ message: "Proposal not found or access denied" });
      }

      if (proposal.isUnlocked) {
        return res.json(proposal);
      }

      const hasValidCredits = user.proposalCredits > 0 && 
        (!user.creditsExpireAt || new Date() < user.creditsExpireAt);

      if (!hasValidCredits) {
        return res.status(402).json({ 
          message: "No credits available",
          requiresPayment: true 
        });
      }

      const updatedUser = await storage.deductProposalCredit(userId);
      if (!updatedUser) {
        return res.status(402).json({ 
          message: "Failed to deduct credit",
          requiresPayment: true 
        });
      }

      const unlocked = await storage.unlockProposal(proposalId, userId);
      
      if (!unlocked) {
        return res.status(404).json({ message: "Failed to unlock proposal" });
      }

      res.json({
        ...unlocked,
        remainingCredits: updatedUser.proposalCredits
      });
    } catch (error) {
      console.error("Error unlocking proposal:", error);
      res.status(500).json({ message: "Failed to unlock proposal" });
    }
  });

  app.get('/api/stripe/config', async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error getting Stripe config:", error);
      res.status(500).json({ message: "Failed to get Stripe configuration" });
    }
  });

  app.get('/api/stripe/products', async (req, res) => {
    try {
      const products = await stripeService.listProductsWithPrices();
      
      const productsMap = new Map();
      for (const row of products as any[]) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            active: row.product_active,
            metadata: row.product_metadata,
            prices: []
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
            active: row.price_active,
          });
        }
      }

      res.json({ data: Array.from(productsMap.values()) });
    } catch (error) {
      console.error("Error listing products:", error);
      res.status(500).json({ message: "Failed to list products" });
    }
  });

  app.post('/api/stripe/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { productType } = req.body;

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const validOneTimeTypes = ['starter', 'single', 'pack'];
      const validSubscriptionTypes = ['pro', 'crew'];
      const allValidTypes = [...validOneTimeTypes, ...validSubscriptionTypes];

      if (!productType || !allValidTypes.includes(productType)) {
        return res.status(400).json({ 
          message: "Valid product type is required (starter, pro, crew, single, or pack)" 
        });
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripeService.createCustomer(user.email || '', userId);
        await storage.updateUserStripeInfo(userId, { stripeCustomerId: customer.id });
        customerId = customer.id;
      }

      const successUrl = `${req.protocol}://${req.get('host')}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${req.protocol}://${req.get('host')}/dashboard?canceled=true`;

      let session;
      if (validSubscriptionTypes.includes(productType)) {
        session = await stripeService.createSubscriptionCheckoutSession(
          customerId,
          productType as 'pro' | 'crew',
          successUrl,
          cancelUrl,
          userId
        );
      } else {
        session = await stripeService.createOneTimeCheckoutSession(
          customerId,
          productType as 'starter' | 'single' | 'pack',
          successUrl,
          cancelUrl,
          userId
        );
      }

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      
      // Provide more specific error messages based on the error type
      let message = 'Failed to create checkout session';
      let status = 500;
      
      if (error?.type === 'StripeAuthenticationError' || error?.code === 'api_key_expired') {
        message = 'Payment service is temporarily unavailable. Please try again later.';
        status = 503;
      } else if (error?.type === 'StripeInvalidRequestError') {
        message = error?.message || 'Invalid payment request. Please try again.';
        status = 400;
      } else if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED') {
        message = 'Unable to connect to payment service. Please check your internet connection.';
        status = 503;
      } else if (error?.message) {
        message = `Failed to create checkout session: ${error.message}`;
      }
      
      res.status(status).json({ message });
    }
  });

  app.post('/api/stripe/verify-session', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }

      const session = await stripeService.retrieveCheckoutSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      if (session.payment_status !== 'paid') {
        return res.status(400).json({ message: "Payment not completed" });
      }

      if (session.metadata?.userId !== userId) {
        return res.status(403).json({ message: "Session does not belong to this user" });
      }

      const credits = parseInt(session.metadata?.credits || '0');
      const productType = session.metadata?.productType as 'single' | 'pack';

      if (credits < 1) {
        return res.status(400).json({ message: "Invalid credits in session" });
      }

      const expiresAt = productType === 'pack' 
        ? new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000)
        : null;

      const result = await storage.addProposalCredits(userId, credits, expiresAt, sessionId);
      
      if (!result.user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ 
        proposalCredits: result.user.proposalCredits,
        creditsExpireAt: result.user.creditsExpireAt,
        creditsAdded: result.alreadyProcessed ? 0 : credits,
        alreadyProcessed: result.alreadyProcessed
      });
    } catch (error: any) {
      if (error.code === 'resource_missing') {
        return res.status(404).json({ message: "Invalid session" });
      }
      console.error("Error verifying session:", error);
      res.status(500).json({ message: "Failed to verify session" });
    }
  });

  app.get('/api/stripe/subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.stripeSubscriptionId) {
        return res.json({ subscription: null });
      }

      const subscription = await storage.getSubscription(user.stripeSubscriptionId);
      res.json({ subscription });
    } catch (error) {
      console.error("Error getting subscription:", error);
      res.status(500).json({ message: "Failed to get subscription" });
    }
  });

  app.post('/api/stripe/portal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: "No Stripe customer found" });
      }

      const session = await stripeService.createCustomerPortalSession(
        user.stripeCustomerId,
        `${req.protocol}://${req.get('host')}/dashboard`
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ message: "Failed to create portal session" });
    }
  });

  // Payment link endpoint for proposals
  app.post('/api/proposals/:id/payment-link', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const proposalId = parseInt(req.params.id);
      const { depositPercentage } = req.body;

      if (!depositPercentage || ![25, 50, 100].includes(depositPercentage)) {
        return res.status(400).json({ message: "Deposit percentage must be 25, 50, or 100" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.userStripeEnabled || !user.userStripeSecretKey) {
        return res.status(400).json({ 
          message: "Please configure your Stripe settings in Settings to generate payment links" 
        });
      }

      const proposal = await storage.getProposal(proposalId);
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }

      if (proposal.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (proposal.paymentLinkId) {
        try {
          await stripeService.deactivatePaymentLink(proposal.paymentLinkId);
        } catch (e) {
          console.log("Could not deactivate previous payment link:", e);
        }
      }

      const avgPrice = Math.round((proposal.priceLow + proposal.priceHigh) / 2);
      const depositAmount = Math.round(avgPrice * depositPercentage / 100);

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const successUrl = proposal.publicToken 
        ? `${baseUrl}/p/${proposal.publicToken}?payment=success`
        : `${baseUrl}/dashboard?payment=success&proposalId=${proposalId}`;

      const paymentLink = await stripeService.createPaymentLink(
        depositAmount * 100,
        proposalId,
        proposal.clientName,
        proposal.jobTypeName,
        successUrl,
        user.userStripeSecretKey
      );

      const updated = await storage.updateProposal(proposalId, userId, {
        paymentLinkId: paymentLink.id,
        paymentLinkUrl: paymentLink.url,
        depositPercentage,
        depositAmount: depositAmount * 100,
        paymentStatus: 'pending',
      });

      res.json({
        paymentLinkUrl: paymentLink.url,
        depositAmount: depositAmount,
        depositPercentage,
        proposal: updated,
      });
    } catch (error) {
      console.error("Error creating payment link:", error);
      res.status(500).json({ message: "Failed to create payment link" });
    }
  });

  // Cancellation feedback endpoint
  app.post('/api/cancellation-feedback', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { reason, details } = req.body;

      const validationResult = insertCancellationFeedbackSchema.safeParse({
        userId,
        reason,
        details,
      });

      if (!validationResult.success) {
        const error = fromZodError(validationResult.error);
        return res.status(400).json({ message: error.message });
      }

      await storage.saveCancellationFeedback(validationResult.data);

      // Get user to check if they have a Stripe customer ID for portal redirect
      const user = await storage.getUser(userId);
      let portalUrl = null;
      
      if (user?.stripeCustomerId) {
        try {
          const session = await stripeService.createCustomerPortalSession(
            user.stripeCustomerId,
            `${req.protocol}://${req.get('host')}/settings?canceled=true`
          );
          portalUrl = session.url;
        } catch (portalError) {
          console.error("Error creating portal session for cancellation:", portalError);
        }
      }

      res.json({ 
        message: "Feedback saved successfully",
        portalUrl 
      });
    } catch (error) {
      console.error("Error saving cancellation feedback:", error);
      res.status(500).json({ message: "Failed to save feedback" });
    }
  });

  // Company/Workspace routes for Crew plan
  app.get('/api/company', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if user is a member of any company
      const membership = await storage.getUserCompanyMembership(userId);
      if (!membership) {
        return res.json(null);
      }

      const memberCount = await storage.getCompanyMemberCount(membership.companyId);
      
      res.json({
        company: membership.company,
        role: membership.role,
        memberCount,
        totalSeats: membership.company.seatLimit + membership.company.extraSeats,
      });
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  app.post('/api/company', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, address, phone, licenseNumber } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ message: "Company name is required" });
      }

      // Check if user already has a company
      const existingMembership = await storage.getUserCompanyMembership(userId);
      if (existingMembership) {
        return res.status(400).json({ message: "You are already part of a company" });
      }

      const company = await storage.createCompany({
        name: name.trim(),
        ownerId: userId,
        seatLimit: 3, // Default 3 seats for Crew plan
        address: address || null,
        phone: phone || null,
        licenseNumber: licenseNumber || null,
      });

      res.json({
        company,
        role: 'owner',
        memberCount: 1,
        totalSeats: company.seatLimit,
      });
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  app.patch('/api/company', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, address, phone, logo, licenseNumber } = req.body;

      const membership = await storage.getUserCompanyMembership(userId);
      if (!membership || membership.role !== 'owner') {
        return res.status(403).json({ message: "Only company owners can update company details" });
      }

      const updated = await storage.updateCompany(membership.companyId, userId, {
        name: name || undefined,
        address: address || undefined,
        phone: phone || undefined,
        logo: logo || undefined,
        licenseNumber: licenseNumber || undefined,
      });

      if (!updated) {
        return res.status(404).json({ message: "Company not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  // Company members routes
  app.get('/api/company/members', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const membership = await storage.getUserCompanyMembership(userId);
      if (!membership) {
        return res.status(404).json({ message: "You are not part of a company" });
      }

      const members = await storage.getCompanyMembers(membership.companyId);
      
      res.json(members.map(m => ({
        id: m.id,
        role: m.role,
        createdAt: m.createdAt,
        user: {
          id: m.user.id,
          email: m.user.email,
          firstName: m.user.firstName,
          lastName: m.user.lastName,
          profileImageUrl: m.user.profileImageUrl,
        }
      })));
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.patch('/api/company/members/:userId/role', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const targetUserId = req.params.userId;
      const { role } = req.body;

      if (!['admin', 'member'].includes(role)) {
        return res.status(400).json({ message: "Role must be 'admin' or 'member'" });
      }

      const membership = await storage.getUserCompanyMembership(currentUserId);
      if (!membership || membership.role !== 'owner') {
        return res.status(403).json({ message: "Only company owners can change member roles" });
      }

      if (targetUserId === currentUserId) {
        return res.status(400).json({ message: "You cannot change your own role" });
      }

      const updated = await storage.updateMemberRole(membership.companyId, targetUserId, role);
      if (!updated) {
        return res.status(404).json({ message: "Member not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating member role:", error);
      res.status(500).json({ message: "Failed to update member role" });
    }
  });

  app.delete('/api/company/members/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const targetUserId = req.params.userId;

      const membership = await storage.getUserCompanyMembership(currentUserId);
      if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
        return res.status(403).json({ message: "Only company owners and admins can remove members" });
      }

      // Check if trying to remove owner
      const targetMembership = await storage.getUserCompanyMembership(targetUserId);
      if (targetMembership?.role === 'owner') {
        return res.status(400).json({ message: "Cannot remove the company owner" });
      }

      const removed = await storage.removeMember(membership.companyId, targetUserId);
      if (!removed) {
        return res.status(404).json({ message: "Member not found" });
      }

      res.json({ message: "Member removed successfully" });
    } catch (error) {
      console.error("Error removing member:", error);
      res.status(500).json({ message: "Failed to remove member" });
    }
  });

  // Invite routes
  app.get('/api/company/invites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const membership = await storage.getUserCompanyMembership(userId);
      if (!membership) {
        return res.status(404).json({ message: "You are not part of a company" });
      }

      const invites = await storage.getCompanyInvites(membership.companyId);
      res.json(invites);
    } catch (error) {
      console.error("Error fetching invites:", error);
      res.status(500).json({ message: "Failed to fetch invites" });
    }
  });

  app.post('/api/company/invites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { email, role = 'member' } = req.body;

      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ message: "Valid email is required" });
      }

      if (!['admin', 'member'].includes(role)) {
        return res.status(400).json({ message: "Role must be 'admin' or 'member'" });
      }

      const membership = await storage.getUserCompanyMembership(userId);
      if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
        return res.status(403).json({ message: "Only owners and admins can send invites" });
      }

      // Check seat limit
      const memberCount = await storage.getCompanyMemberCount(membership.companyId);
      const totalSeats = membership.company.seatLimit + membership.company.extraSeats;
      
      if (memberCount >= totalSeats) {
        return res.status(400).json({ 
          message: `Seat limit reached (${memberCount}/${totalSeats}). Upgrade to add more seats.`,
          requiresUpgrade: true
        });
      }

      // Generate invite token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiration

      const invite = await storage.createInvite({
        companyId: membership.companyId,
        email: email.toLowerCase().trim(),
        role,
        token,
        invitedBy: userId,
        expiresAt,
      });

      // Generate invite link
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const inviteLink = `${baseUrl}/invite/${token}`;

      res.json({
        invite,
        inviteLink,
      });
    } catch (error) {
      console.error("Error creating invite:", error);
      res.status(500).json({ message: "Failed to create invite" });
    }
  });

  app.delete('/api/company/invites/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const inviteId = parseInt(req.params.id);

      const membership = await storage.getUserCompanyMembership(userId);
      if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
        return res.status(403).json({ message: "Only owners and admins can delete invites" });
      }

      const deleted = await storage.deleteInvite(inviteId, membership.companyId);
      if (!deleted) {
        return res.status(404).json({ message: "Invite not found" });
      }

      res.json({ message: "Invite deleted successfully" });
    } catch (error) {
      console.error("Error deleting invite:", error);
      res.status(500).json({ message: "Failed to delete invite" });
    }
  });

  // Public invite acceptance route
  app.get('/api/invite/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      const invite = await storage.getInviteByToken(token);
      if (!invite) {
        return res.status(404).json({ message: "Invite not found" });
      }

      if (invite.acceptedAt) {
        return res.status(400).json({ message: "This invite has already been used" });
      }

      if (new Date() > invite.expiresAt) {
        return res.status(400).json({ message: "This invite has expired" });
      }

      res.json({
        companyName: invite.company.name,
        role: invite.role,
        email: invite.email,
        expiresAt: invite.expiresAt,
      });
    } catch (error) {
      console.error("Error fetching invite:", error);
      res.status(500).json({ message: "Failed to fetch invite" });
    }
  });

  app.post('/api/invite/:token/accept', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { token } = req.params;

      // Check if user already in a company
      const existingMembership = await storage.getUserCompanyMembership(userId);
      if (existingMembership) {
        return res.status(400).json({ message: "You are already part of a company" });
      }

      // Get invite to check seat limits before accepting
      const invite = await storage.getInviteByToken(token);
      if (!invite) {
        return res.status(400).json({ message: "Invalid invite" });
      }
      
      // Check seat limit
      const memberCount = await storage.getCompanyMemberCount(invite.companyId);
      const totalSeats = invite.company.seatLimit + invite.company.extraSeats;
      
      if (memberCount >= totalSeats) {
        return res.status(400).json({ 
          message: "This team has reached its seat limit. Contact the team owner to add more seats.",
        });
      }

      const member = await storage.acceptInvite(token, userId);
      if (!member) {
        return res.status(400).json({ message: "Invalid, expired, or already used invite" });
      }

      res.json({
        message: "Successfully joined the company",
        role: member.role,
      });
    } catch (error) {
      console.error("Error accepting invite:", error);
      res.status(500).json({ message: "Failed to accept invite" });
    }
  });

  // Analytics endpoints
  app.get('/api/analytics/pricing-summary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analytics = await storage.getProposalAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching pricing summary:", error);
      res.status(500).json({ message: "Failed to fetch pricing summary" });
    }
  });

  app.get('/api/analytics/benchmarks', async (req, res) => {
    try {
      res.json({
        trades: benchmarkTrades,
        regions: regionalMultipliers,
      });
    } catch (error) {
      console.error("Error fetching benchmarks:", error);
      res.status(500).json({ message: "Failed to fetch benchmarks" });
    }
  });

  // Search Console routes (crew only)
  const isCrewUser = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (user?.subscriptionPlan !== 'crew') {
        return res.status(403).json({ message: "This feature requires a Crew subscription" });
      }
      next();
    } catch (error) {
      res.status(500).json({ message: "Failed to verify subscription" });
    }
  };

  app.get('/api/search-console/test', isAuthenticated, isCrewUser, async (req: any, res) => {
    try {
      const { searchConsoleService } = await import('./services/searchConsole');
      const result = await searchConsoleService.testConnection();
      res.json(result);
    } catch (error: any) {
      console.error("Error testing Search Console connection:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to test connection" });
    }
  });

  app.get('/api/search-console/sites', isAuthenticated, isCrewUser, async (req: any, res) => {
    try {
      const { searchConsoleService } = await import('./services/searchConsole');
      const sites = await searchConsoleService.listSites();
      res.json(sites);
    } catch (error: any) {
      console.error("Error fetching Search Console sites:", error);
      res.status(500).json({ message: error.message || "Failed to fetch sites" });
    }
  });

  app.get('/api/search-console/analytics', isAuthenticated, isCrewUser, async (req: any, res) => {
    try {
      const { siteUrl, startDate, endDate, dimensions, rowLimit } = req.query;
      
      if (!siteUrl || !startDate || !endDate) {
        return res.status(400).json({ message: "siteUrl, startDate, and endDate are required" });
      }

      const { searchConsoleService } = await import('./services/searchConsole');
      const analytics = await searchConsoleService.getSearchAnalytics(
        siteUrl as string,
        startDate as string,
        endDate as string,
        dimensions ? (dimensions as string).split(',') : ['query'],
        rowLimit ? parseInt(rowLimit as string) : 100
      );
      res.json(analytics);
    } catch (error: any) {
      console.error("Error fetching Search Console analytics:", error);
      res.status(500).json({ message: error.message || "Failed to fetch analytics" });
    }
  });

  app.get('/api/search-console/sitemaps', isAuthenticated, isCrewUser, async (req: any, res) => {
    try {
      const { siteUrl } = req.query;
      
      if (!siteUrl) {
        return res.status(400).json({ message: "siteUrl is required" });
      }

      const { searchConsoleService } = await import('./services/searchConsole');
      const sitemaps = await searchConsoleService.listSitemaps(siteUrl as string);
      res.json(sitemaps);
    } catch (error: any) {
      console.error("Error fetching sitemaps:", error);
      res.status(500).json({ message: error.message || "Failed to fetch sitemaps" });
    }
  });

  app.post('/api/search-console/sitemaps', isAuthenticated, isCrewUser, async (req: any, res) => {
    try {
      const { siteUrl, feedpath } = req.body;
      
      if (!siteUrl || !feedpath) {
        return res.status(400).json({ message: "siteUrl and feedpath are required" });
      }

      const { searchConsoleService } = await import('./services/searchConsole');
      await searchConsoleService.submitSitemap(siteUrl, feedpath);
      res.json({ message: "Sitemap submitted successfully" });
    } catch (error: any) {
      console.error("Error submitting sitemap:", error);
      res.status(500).json({ message: error.message || "Failed to submit sitemap" });
    }
  });

  app.delete('/api/search-console/sitemaps', isAuthenticated, isCrewUser, async (req: any, res) => {
    try {
      const { siteUrl, feedpath } = req.query;
      
      if (!siteUrl || !feedpath) {
        return res.status(400).json({ message: "siteUrl and feedpath are required" });
      }

      const { searchConsoleService } = await import('./services/searchConsole');
      await searchConsoleService.deleteSitemap(siteUrl as string, feedpath as string);
      res.json({ message: "Sitemap deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting sitemap:", error);
      res.status(500).json({ message: error.message || "Failed to delete sitemap" });
    }
  });

  app.post('/api/search-console/inspect-url', isAuthenticated, isCrewUser, async (req: any, res) => {
    try {
      const { siteUrl, inspectionUrl } = req.body;
      
      if (!siteUrl || !inspectionUrl) {
        return res.status(400).json({ message: "siteUrl and inspectionUrl are required" });
      }

      const { searchConsoleService } = await import('./services/searchConsole');
      const result = await searchConsoleService.inspectUrl(siteUrl, inspectionUrl);
      res.json(result);
    } catch (error: any) {
      console.error("Error inspecting URL:", error);
      res.status(500).json({ message: error.message || "Failed to inspect URL" });
    }
  });

  return httpServer;
}
