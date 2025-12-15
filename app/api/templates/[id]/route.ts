import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/server/db';
import { proposalTemplates } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

// GET /api/templates/[id] - Get a single template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const templateId = parseInt(id);
    
    if (isNaN(templateId)) {
      return NextResponse.json(
        { message: 'Invalid template ID' },
        { status: 400 }
      );
    }

    const [template] = await db
      .select()
      .from(proposalTemplates)
      .where(eq(proposalTemplates.id, templateId));

    if (!template) {
      return NextResponse.json(
        { message: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { message: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

// PATCH /api/templates/[id] - Update a custom template
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const templateId = parseInt(id);
    
    if (isNaN(templateId)) {
      return NextResponse.json(
        { message: 'Invalid template ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Can only update templates created by this user
    const [updated] = await db
      .update(proposalTemplates)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(proposalTemplates.id, templateId),
          eq(proposalTemplates.createdBy, userId)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { message: 'Template not found or you do not have permission to edit it' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { message: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE /api/templates/[id] - Delete a custom template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const templateId = parseInt(id);
    
    if (isNaN(templateId)) {
      return NextResponse.json(
        { message: 'Invalid template ID' },
        { status: 400 }
      );
    }

    // Can only delete templates created by this user (not system templates)
    const [deleted] = await db
      .delete(proposalTemplates)
      .where(
        and(
          eq(proposalTemplates.id, templateId),
          eq(proposalTemplates.createdBy, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { message: 'Template not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { message: 'Failed to delete template' },
      { status: 500 }
    );
  }
}

// POST /api/templates/[id]/use - Track template usage
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const templateId = parseInt(id);
    
    if (isNaN(templateId)) {
      return NextResponse.json(
        { message: 'Invalid template ID' },
        { status: 400 }
      );
    }

    // Increment usage count
    await db
      .update(proposalTemplates)
      .set({
        usageCount: sql`${proposalTemplates.usageCount} + 1`,
      })
      .where(eq(proposalTemplates.id, templateId));

    return NextResponse.json({ message: 'Usage tracked' });
  } catch (error) {
    console.error('Error tracking template usage:', error);
    return NextResponse.json(
      { message: 'Failed to track usage' },
      { status: 500 }
    );
  }
}
