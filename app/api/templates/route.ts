import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/services/db';
import { proposalTemplates, insertTemplateSchema } from '@shared/schema';
import { eq, and, or, isNull, desc } from 'drizzle-orm';

// GET /api/templates - List all templates (system + user's custom)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(request.url);
    const tradeId = searchParams.get('tradeId');
    
    // Build where clause - get system templates OR user's templates
    const whereConditions = [
      eq(proposalTemplates.isActive, true),
    ];
    
    if (userId) {
      // Get system templates (createdBy is null) OR user's templates
      whereConditions.push(
        or(
          isNull(proposalTemplates.createdBy),
          eq(proposalTemplates.createdBy, userId)
        )!
      );
    } else {
      // Only system templates for unauthenticated users
      whereConditions.push(isNull(proposalTemplates.createdBy));
    }
    
    if (tradeId) {
      whereConditions.push(eq(proposalTemplates.tradeId, tradeId));
    }
    
    const templates = await db
      .select()
      .from(proposalTemplates)
      .where(and(...whereConditions))
      .orderBy(desc(proposalTemplates.usageCount), proposalTemplates.tradeName, proposalTemplates.jobTypeName);
    
    // Group by trade for easier consumption
    const byTrade = templates.reduce((acc, template) => {
      if (!acc[template.tradeId]) {
        acc[template.tradeId] = {
          tradeId: template.tradeId,
          tradeName: template.tradeName,
          jobTypes: [],
        };
      }
      acc[template.tradeId].jobTypes.push({
        id: template.id,
        jobTypeId: template.jobTypeId,
        jobTypeName: template.jobTypeName,
        baseScope: template.baseScope,
        options: template.options,
        basePriceLow: template.basePriceLow,
        basePriceHigh: template.basePriceHigh,
        estimatedDaysLow: template.estimatedDaysLow,
        estimatedDaysHigh: template.estimatedDaysHigh,
        warranty: template.warranty,
        exclusions: template.exclusions,
        isDefault: template.isDefault,
        isCustom: template.createdBy !== null,
        usageCount: template.usageCount,
      });
      return acc;
    }, {} as Record<string, { tradeId: string; tradeName: string; jobTypes: unknown[] }>);
    
    return NextResponse.json({
      templates: Object.values(byTrade),
      total: templates.length,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { message: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/templates - Create a custom template
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const validationResult = insertTemplateSchema.safeParse({
      ...body,
      createdBy: userId,
      isDefault: false, // User templates are never default
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { message: validationResult.error.issues[0]?.message || 'Invalid template data' },
        { status: 400 }
      );
    }

    const [template] = await db
      .insert(proposalTemplates)
      .values(validationResult.data)
      .returning();

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { message: 'Failed to create template' },
      { status: 500 }
    );
  }
}
