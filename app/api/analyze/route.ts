import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  RekognitionClient,
  DetectLabelsCommand,
} from "@aws-sdk/client-rekognition";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- CONFIGURATION ---
// NOTE: This route is intentionally hardcoded per your request.
const BUCKET_NAME = "scopegen25";
const REGION = process.env.AWS_REGION || "us-east-1";

function getAwsCredentials() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    return null;
  }

  return { accessKeyId, secretAccessKey };
}

// Initialize AWS Clients
const s3 = new S3Client({
  region: REGION,
  credentials: getAwsCredentials() ?? undefined,
});

const rekognition = new RekognitionClient({
  region: REGION,
  credentials: getAwsCredentials() ?? undefined,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 1. Prepare File for Upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a clean filename (e.g., "170923000-kitchen-sink.jpg")
    const sanitizedFileName = file.name.replace(/\s+/g, "-").toLowerCase();
    const filename = `${Date.now()}-${sanitizedFileName}`;

    // 2. Upload to S3 (scopegen25)
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: filename,
        Body: buffer,
        ContentType: file.type,
      })
    );

    // 3. Analyze with Rekognition (reference the exact object we just uploaded)
    const analysis = await rekognition.send(
      new DetectLabelsCommand({
        Image: {
          S3Object: {
            Bucket: BUCKET_NAME,
            Name: filename,
          },
        },
        MaxLabels: 15,
        MinConfidence: 75,
      })
    );

    // 4. Return Data
    return NextResponse.json({
      success: true,
      imageUrl: `https://${BUCKET_NAME}.s3.amazonaws.com/${filename}`,
      labels: analysis.Labels,
    });
  } catch (error) {
    console.error("AWS Process Error:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
