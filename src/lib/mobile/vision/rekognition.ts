import { RekognitionClient, DetectLabelsCommand } from "@aws-sdk/client-rekognition";

function getRekognitionClient() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  
  if (!accessKeyId || !secretAccessKey) {
    console.warn("vision.rekognition.noCredentials", {
      message: "AWS credentials not configured - Rekognition will be skipped",
      hasAccessKey: !!accessKeyId,
      hasSecretKey: !!secretAccessKey,
    });
    return null;
  }
  
  return new RekognitionClient({
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1",
    credentials: { accessKeyId, secretAccessKey },
  });
}

async function fetchImageBytes(url: string): Promise<Uint8Array> {
  console.log("vision.rekognition.fetchImage", { url: url.substring(0, 80) + "..." });
  
  const res = await fetch(url, {
    headers: {
      // Some CDNs need a user-agent
      "User-Agent": "ScopeGen-Vision/1.0",
    },
  });
  
  if (!res.ok) {
    const errorDetail = `Failed to fetch image: status=${res.status} statusText=${res.statusText}`;
    console.error("vision.rekognition.fetchFailed", { 
      url: url.substring(0, 80), 
      status: res.status,
      statusText: res.statusText,
    });
    throw new Error(errorDetail);
  }
  
  const buf = await res.arrayBuffer();
  console.log("vision.rekognition.imageFetched", { bytes: buf.byteLength });
  return new Uint8Array(buf);
}

export async function analyzeWithRekognition(params: {
  imageUrl: string;
  maxLabels?: number;
  minConfidence?: number;
}) {
  const client = getRekognitionClient();
  
  if (!client) {
    throw new Error("REKOGNITION_NO_CREDENTIALS: AWS credentials not configured");
  }
  
  const bytes = await fetchImageBytes(params.imageUrl);

  const cmd = new DetectLabelsCommand({
    Image: { Bytes: bytes },
    MaxLabels: params.maxLabels ?? 20,
    MinConfidence: params.minConfidence ?? 70,
  });

  const out = await client.send(cmd);
  const labels = (out.Labels || [])
    .filter((l) => l.Name && typeof l.Confidence === "number")
    .map((l) => ({ name: l.Name as string, confidence: l.Confidence as number }))
    .sort((a, b) => b.confidence - a.confidence);

  return {
    provider: "aws" as const,
    service: "rekognition" as const,
    model: "DetectLabels",
    labels,
  };
}
