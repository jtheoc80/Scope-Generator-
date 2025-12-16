import { NextRequest, NextResponse } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { registerPhotoRequestSchema } from "@/src/lib/mobile/types";
import { storage } from "@/lib/services/storage";

// POST /api/mobile/jobs/:jobId/photos (register uploaded photo public URL)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const authResult = await requireMobileAuth(request);
    if (!authResult.ok) return authResult.response;

    const { jobId } = await params;
    const id = parseInt(jobId);
    if (Number.isNaN(id)) {
      return NextResponse.json({ message: "Invalid jobId" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = registerPhotoRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid photo payload" },
        { status: 400 }
      );
    }

    const photo = await storage.addMobileJobPhoto(id, authResult.userId, {
      publicUrl: parsed.data.url,
      kind: parsed.data.kind,
    });

    return NextResponse.json({ photoId: photo.id }, { status: 201 });
  } catch (error) {
    console.error("Error registering mobile job photo:", error);
    return NextResponse.json(
      { message: "Failed to register photo" },
      { status: 500 }
    );
  }
}
