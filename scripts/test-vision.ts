/**
 * Diagnostic script to test vision pipeline
 * Run with: npx ts-node scripts/test-vision.ts <imageUrl>
 */

import { S3Client, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { RekognitionClient, DetectLabelsCommand } from "@aws-sdk/client-rekognition";
import OpenAI from "openai";

async function main() {
  console.log("\n=== VISION PIPELINE DIAGNOSTIC ===\n");

  // 1. Check environment variables
  console.log("1. ENVIRONMENT CHECK:");
  const envVars = {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? "✅ Set" : "❌ Missing",
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? "✅ Set" : "❌ Missing",
    AWS_REGION: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "❌ Missing (defaulting to us-east-1)",
    S3_BUCKET: process.env.S3_BUCKET || "❌ Missing",
    S3_PUBLIC_BASE_URL: process.env.S3_PUBLIC_BASE_URL || "❌ Missing",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "✅ Set" : "❌ Missing",
  };
  console.table(envVars);

  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    console.error("\n❌ AWS credentials missing. Cannot proceed.\n");
    return;
  }

  // 2. Test S3 connection
  console.log("\n2. S3 CONNECTION TEST:");
  const s3Client = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  try {
    if (bucket) {
      const listResult = await s3Client.send(new ListObjectsV2Command({
        Bucket: bucket,
        MaxKeys: 5,
        Prefix: "mobile/",
      }));
      console.log(`✅ S3 connection successful. Found ${listResult.KeyCount || 0} objects in mobile/ prefix`);
      if (listResult.Contents && listResult.Contents.length > 0) {
        console.log("   Sample objects:");
        listResult.Contents.slice(0, 3).forEach(obj => {
          console.log(`   - ${obj.Key} (${obj.Size} bytes)`);
        });
      }
    } else {
      console.log("⚠️ S3_BUCKET not set, skipping bucket list test");
    }
  } catch (err) {
    console.error("❌ S3 connection failed:", err instanceof Error ? err.message : err);
  }

  // 3. Test Rekognition connection  
  console.log("\n3. REKOGNITION CONNECTION TEST:");
  const rekClient = new RekognitionClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  // 4. Test with a specific image if bucket has objects
  if (bucket) {
    console.log("\n4. IMAGE FETCH TEST:");
    try {
      const listResult = await s3Client.send(new ListObjectsV2Command({
        Bucket: bucket,
        MaxKeys: 1,
        Prefix: "mobile/",
      }));

      if (listResult.Contents && listResult.Contents.length > 0) {
        const testKey = listResult.Contents[0].Key!;
        console.log(`   Testing with: ${testKey}`);

        // Fetch from S3
        const getResult = await s3Client.send(new GetObjectCommand({
          Bucket: bucket,
          Key: testKey,
        }));

        if (getResult.Body) {
          const bytes = await getResult.Body.transformToByteArray();
          console.log(`   ✅ Successfully fetched ${bytes.length} bytes from S3`);

          // Test Rekognition
          console.log("\n5. REKOGNITION ANALYSIS TEST:");
          try {
            const rekResult = await rekClient.send(new DetectLabelsCommand({
              Image: { Bytes: bytes },
              MaxLabels: 10,
              MinConfidence: 70,
            }));
            console.log(`   ✅ Rekognition returned ${rekResult.Labels?.length || 0} labels:`);
            rekResult.Labels?.slice(0, 5).forEach(label => {
              console.log(`      - ${label.Name} (${Math.round(label.Confidence || 0)}%)`);
            });
          } catch (rekErr) {
            console.error("   ❌ Rekognition failed:", rekErr instanceof Error ? rekErr.message : rekErr);
          }

          // Test OpenAI
          console.log("\n6. OPENAI VISION TEST:");
          if (process.env.OPENAI_API_KEY) {
            try {
              const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
              const contentType = getResult.ContentType || "image/jpeg";
              const base64 = Buffer.from(bytes).toString("base64");
              const dataUrl = `data:${contentType};base64,${base64}`;

              console.log("   Sending to GPT-4o-mini...");
              const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                  {
                    role: "user",
                    content: [
                      { type: "text", text: "Briefly describe what you see in this image in 1-2 sentences." },
                      { type: "image_url", image_url: { url: dataUrl } },
                    ],
                  },
                ],
                max_tokens: 100,
              });
              console.log(`   ✅ OpenAI response: "${response.choices[0]?.message?.content}"`);
            } catch (openaiErr) {
              console.error("   ❌ OpenAI failed:", openaiErr instanceof Error ? openaiErr.message : openaiErr);
            }
          } else {
            console.log("   ⚠️ OPENAI_API_KEY not set, skipping OpenAI test");
          }
        }
      } else {
        console.log("   ⚠️ No images found in mobile/ prefix");
      }
    } catch (err) {
      console.error("   ❌ Image fetch failed:", err instanceof Error ? err.message : err);
    }
  }

  console.log("\n=== DIAGNOSTIC COMPLETE ===\n");
}

main().catch(console.error);
