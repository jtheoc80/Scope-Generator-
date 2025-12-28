import OpenAI from "openai";
import { parseS3Url, fetchS3ObjectBytes, type S3ObjectRef } from "@/src/lib/mobile/storage/s3";

export type ImageEmbeddingResult = {
  model: string;
  dimension: number;
  embedding: number[];
};

export interface ImageEmbeddingProvider {
  /**
   * Returns a fixed-dimension embedding vector for an image.
   *
   * IMPORTANT: This runs server-side only (uses secrets).
   */
  embedImage(params: { imageUrl: string; s3Ref?: S3ObjectRef | null }): Promise<ImageEmbeddingResult>;
}

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is required for embeddings");
  return new OpenAI({ apiKey, timeout: 60000 });
}

function detectImageMimeType(bytes: Uint8Array): string {
  // JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  // PNG: 89 50 4E 47
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  return "image/jpeg";
}

function bytesToDataUrl(bytes: Uint8Array): string {
  const mimeType = detectImageMimeType(bytes);
  const base64 = Buffer.from(bytes).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Phase 1 image embedding strategy:
 * - Use OpenAI Vision to generate a short, stable "embedding caption"
 * - Embed that caption with a text embedding model (fixed-dimension vector)
 *
 * This keeps the embedding dimension stable (pgvector vector(1536)) and avoids storing raw images.
 */
export class OpenAIImageEmbeddingProvider implements ImageEmbeddingProvider {
  private visionModel: string;
  private embeddingModel: string;
  private embeddingDimension: number;

  constructor(params?: { visionModel?: string; embeddingModel?: string; embeddingDimension?: number }) {
    this.visionModel = params?.visionModel || process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";
    this.embeddingModel = params?.embeddingModel || process.env.OPENAI_IMAGE_EMBEDDING_MODEL || "text-embedding-3-small";
    // text-embedding-3-small default dimension is 1536
    this.embeddingDimension = params?.embeddingDimension || 1536;
  }

  async embedImage(params: { imageUrl: string; s3Ref?: S3ObjectRef | null }): Promise<ImageEmbeddingResult> {
    const client = getOpenAIClient();
    const s3Ref = params.s3Ref !== undefined ? params.s3Ref : parseS3Url(params.imageUrl);

    // Fetch bytes directly from S3 when possible for reliability (no redirect/signed URL issues).
    let bytes: Uint8Array;
    if (s3Ref) {
      bytes = await fetchS3ObjectBytes(s3Ref);
    } else {
      const res = await fetch(params.imageUrl, { redirect: "follow", headers: { Accept: "image/*,*/*" } });
      if (!res.ok) throw new Error(`EMBED_FETCH_ERROR: Failed to fetch image (${res.status})`);
      bytes = new Uint8Array(await res.arrayBuffer());
    }
    if (bytes.length === 0) throw new Error("EMBED_EMPTY_IMAGE: Image is empty (0 bytes)");

    const imageDataUrl = bytesToDataUrl(bytes);

    // 1) Create a compact, stable caption for embeddings (no PII; no addresses/names).
    const captionResp = await client.chat.completions.create({
      model: this.visionModel,
      messages: [
        {
          role: "system",
          content:
            "You generate a compact, stable embedding caption for a contractor jobsite photo.\n" +
            "Rules:\n" +
            "- Output ONLY plain text (no JSON).\n" +
            "- 1-3 short sentences.\n" +
            "- Focus on visible materials, fixtures, damage, and work type.\n" +
            "- Avoid any personal data (names, addresses, license plates).\n",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Write the embedding caption for this image." },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 180,
    });

    const caption = captionResp.choices[0]?.message?.content?.trim();
    if (!caption) throw new Error("EMBED_CAPTION_EMPTY: OpenAI returned no caption");

    // 2) Embed the caption with a fixed-dimension text embedding model.
    const emb = await client.embeddings.create({
      model: this.embeddingModel,
      input: caption,
      // NOTE: OpenAI supports `dimensions` for some models; keep stable at 1536 for vector(1536).
      // If the provider rejects this parameter for a future model, remove it and migrate DB dimension.
      dimensions: this.embeddingDimension,
    } as any);

    const vec = emb.data?.[0]?.embedding;
    if (!Array.isArray(vec) || vec.length !== this.embeddingDimension) {
      throw new Error(
        `EMBED_DIM_MISMATCH: expected ${this.embeddingDimension}, got ${Array.isArray(vec) ? vec.length : "null"}`
      );
    }

    return {
      model: this.embeddingModel,
      dimension: this.embeddingDimension,
      embedding: vec,
    };
  }
}

