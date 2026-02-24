import { NextRequest, NextResponse } from "next/server";
import { submitUrl, submitUrls } from "@/lib/seo/indexnow";

/**
 * POST /api/indexnow
 * Submit URLs to IndexNow for instant search engine indexing.
 *
 * Body:
 *  - url (string): Single URL to submit
 *  - urls (string[]): Multiple URLs to submit in bulk
 *
 * Requires INDEXNOW_ADMIN_SECRET header for authorization.
 */
export async function POST(request: NextRequest) {
  const adminSecret = process.env.INDEXNOW_ADMIN_SECRET;
  if (adminSecret) {
    const authHeader = request.headers.get("x-admin-secret");
    if (authHeader !== adminSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const body = await request.json();
    const { url, urls } = body as { url?: string; urls?: string[] };

    if (!url && (!urls || urls.length === 0)) {
      return NextResponse.json(
        { error: "Provide 'url' (string) or 'urls' (string[]) in request body" },
        { status: 400 }
      );
    }

    const result = urls && urls.length > 0
      ? await submitUrls(urls)
      : await submitUrl(url!);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[IndexNow] Submission failed:", error);
    return NextResponse.json(
      { error: "Failed to submit URLs to IndexNow" },
      { status: 500 }
    );
  }
}
