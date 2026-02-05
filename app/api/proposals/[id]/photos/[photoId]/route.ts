import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { storage } from "@/lib/services/storage";
import { db } from "@/lib/services/db";
import { proposalPhotos } from "@shared/schema";
import { and, eq } from "drizzle-orm";
import { cleanupProposalPhotoObjects } from "@/lib/services/photoStorage";

export const runtime = "nodejs";

function jsonError(status: number, message: string) {
  return NextResponse.json({ message }, { status });
}

// PATCH /api/proposals/:id/photos/:photoId
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return jsonError(401, "Unauthorized");

  const { id, photoId } = await params;
  const proposalId = parseInt(id, 10);
  const pid = parseInt(photoId, 10);
  if (Number.isNaN(proposalId) || Number.isNaN(pid)) {
    return jsonError(400, "Invalid ID");
  }

  const proposal = await storage.getProposal(proposalId);
  if (!proposal) return jsonError(404, "Proposal not found");
  if (proposal.userId !== userId) return jsonError(403, "Access denied");

  const body = await request.json().catch(() => ({}));
  const updates: Record<string, unknown> = {};
  if (typeof body?.category === "string") updates.category = body.category;
  if (typeof body?.caption === "string" || body?.caption === null) updates.caption = body.caption;
  if (typeof body?.displayOrder === "number") updates.displayOrder = body.displayOrder;

  if (Object.keys(updates).length === 0) {
    return jsonError(400, "No updates provided");
  }

  const updated = await storage.updateProposalPhoto(pid, proposalId, userId, updates as any);
  if (!updated) return jsonError(404, "Photo not found");

  return NextResponse.json({
    ...updated,
    urls: {
      original: updated.publicUrl,
      thumb: updated.thumbUrl ?? updated.publicUrl,
      medium: updated.mediumUrl ?? updated.publicUrl,
    },
  });
}

// DELETE /api/proposals/:id/photos/:photoId
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return jsonError(401, "Unauthorized");

  const { id, photoId } = await params;
  const proposalId = parseInt(id, 10);
  const pid = parseInt(photoId, 10);
  if (Number.isNaN(proposalId) || Number.isNaN(pid)) {
    return jsonError(400, "Invalid ID");
  }

  const proposal = await storage.getProposal(proposalId);
  if (!proposal) return jsonError(404, "Proposal not found");
  if (proposal.userId !== userId) return jsonError(403, "Access denied");

  const [photo] = await db
    .select()
    .from(proposalPhotos)
    .where(and(eq(proposalPhotos.id, pid), eq(proposalPhotos.proposalId, proposalId)))
    .limit(1);

  if (!photo) return jsonError(404, "Photo not found");

  const ok = await storage.deleteProposalPhoto(pid, proposalId, userId);
  if (!ok) return jsonError(500, "Failed to delete photo");

  // Best-effort cleanup of stored objects.
  void cleanupProposalPhotoObjects([
    photo.storageKey,
    photo.thumbKey,
    photo.mediumKey,
  ]);

  return NextResponse.json({ success: true });
}

