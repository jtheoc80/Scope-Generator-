import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/server/db';
import { photoCategorization } from '@shared/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import type { ProposalPhotoCategory } from '@shared/schema';

/**
 * POST /api/learning/caption-suggestions
 * Get smart caption suggestions based on user's history and category
 */
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
    const { category, jobTypeId } = body;

    if (!category) {
      return NextResponse.json(
        { message: 'Category required' },
        { status: 400 }
      );
    }

    // Get user's previous captions for this category
    const userCaptions = await db
      .select({
        caption: photoCategorization.assignedCaption,
        count: count(),
      })
      .from(photoCategorization)
      .where(and(
        eq(photoCategorization.userId, userId),
        eq(photoCategorization.assignedCategory, category),
        sql`${photoCategorization.assignedCaption} IS NOT NULL`,
        sql`${photoCategorization.assignedCaption} != ''`,
      ))
      .groupBy(photoCategorization.assignedCaption)
      .orderBy(desc(count()))
      .limit(5);

    const suggestions = userCaptions
      .filter(c => c.caption)
      .map(c => c.caption as string);

    // Get template suggestions based on category
    const templates = getCaptionTemplates(category as ProposalPhotoCategory, jobTypeId);

    // Combine user captions with templates, removing duplicates
    const allSuggestions = [
      ...suggestions,
      ...templates.filter(t => !suggestions.includes(t)),
    ].slice(0, 10);

    return NextResponse.json({
      suggestions: allSuggestions,
      userCaptions: suggestions,
      templates,
    });
  } catch (error) {
    console.error('Error getting caption suggestions:', error);
    return NextResponse.json(
      { message: 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}

function getCaptionTemplates(
  category: ProposalPhotoCategory,
  jobTypeId?: string
): string[] {
  // Base templates by category
  const baseTemplates: Record<ProposalPhotoCategory, string[]> = {
    hero: [
      'Project overview',
      'Property exterior',
      'Main work area',
      'Overall view of space',
    ],
    existing: [
      'Current condition',
      'Area requiring attention',
      'Existing setup',
      'Before photo',
    ],
    shower: [
      'Current shower condition',
      'Shower surround showing wear',
      'Existing shower fixtures',
      'Grout condition',
      'Shower pan condition',
    ],
    vanity: [
      'Existing vanity',
      'Sink and countertop condition',
      'Vanity cabinet condition',
      'Mirror and lighting',
    ],
    flooring: [
      'Current flooring condition',
      'Floor transition area',
      'Flooring wear pattern',
      'Subfloor condition',
    ],
    tub: [
      'Existing bathtub',
      'Tub surround condition',
      'Tub drain area',
      'Caulk condition',
    ],
    toilet: [
      'Existing toilet',
      'Toilet area flooring',
      'Toilet flange condition',
    ],
    plumbing: [
      'Under-sink plumbing',
      'Water supply lines',
      'Drain condition',
      'Shut-off valves',
    ],
    electrical: [
      'Existing electrical',
      'Outlet locations',
      'Lighting fixtures',
      'Panel condition',
    ],
    damage: [
      'Water damage visible',
      'Area requiring repair',
      'Damage extent',
      'Moisture reading location',
    ],
    kitchen: [
      'Kitchen overview',
      'Cooking area',
      'Kitchen storage',
      'Counter space',
    ],
    cabinets: [
      'Cabinet condition',
      'Interior cabinet view',
      'Cabinet hardware',
      'Cabinet door condition',
    ],
    countertops: [
      'Countertop condition',
      'Counter edge detail',
      'Surface wear',
      'Seam condition',
    ],
    roofing: [
      'Roof overview',
      'Shingle condition',
      'Flashing area',
      'Valley condition',
      'Ridge condition',
    ],
    siding: [
      'Exterior siding',
      'Siding damage',
      'Siding detail',
      'Corner condition',
    ],
    windows: [
      'Window condition',
      'Frame detail',
      'Seal condition',
      'Glass condition',
    ],
    hvac: [
      'HVAC unit',
      'Vent condition',
      'Ductwork',
      'Filter area',
    ],
    other: [
      'Additional documentation',
      'Reference photo',
      'Site detail',
      'Measurement reference',
    ],
  };

  // Job type specific additions
  const jobTypeAdditions: Record<string, Record<string, string[]>> = {
    'bathroom-remodel': {
      existing: ['Full bathroom overview', 'Bathroom layout'],
      damage: ['Water damage behind toilet', 'Moisture at tub base'],
    },
    'kitchen-remodel': {
      existing: ['Kitchen layout', 'Appliance locations'],
      cabinets: ['Upper cabinet condition', 'Lower cabinet condition'],
    },
  };

  const base = baseTemplates[category] || baseTemplates.other;
  const additions = jobTypeId 
    ? (jobTypeAdditions[jobTypeId]?.[category] || [])
    : [];

  return [...additions, ...base];
}
