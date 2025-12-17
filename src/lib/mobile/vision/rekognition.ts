import { RekognitionClient, DetectLabelsCommand } from "@aws-sdk/client-rekognition";

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

function getRekognitionClient() {
  return new RekognitionClient({
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1",
    credentials: process.env.AWS_ACCESS_KEY_ID
      ? {
          accessKeyId: requireEnv("AWS_ACCESS_KEY_ID"),
          secretAccessKey: requireEnv("AWS_SECRET_ACCESS_KEY"),
        }
      : undefined,
  });
}

async function fetchImageBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

export async function analyzeWithRekognition(params: {
  imageUrl: string;
  maxLabels?: number;
  minConfidence?: number;
}) {
  const client = getRekognitionClient();
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
