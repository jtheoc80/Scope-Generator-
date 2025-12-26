#!/usr/bin/env node
/**
 * AWS Rekognition Smoke Test
 * 
 * This script validates that your AWS Rekognition integration is working correctly.
 * Run this to isolate whether the "no summary" issue is related to Rekognition.
 * 
 * CRITICAL: Rekognition ONLY supports JPEG and PNG images!
 * HEIC (common from iPhone) and WebP will FAIL SILENTLY.
 * 
 * Usage:
 *   node script/rekognition-smoke.mjs ./test.jpg
 * 
 * Prerequisites:
 *   - AWS_REGION environment variable (or defaults to us-east-1)
 *   - AWS_ACCESS_KEY_ID environment variable
 *   - AWS_SECRET_ACCESS_KEY environment variable
 *   - A test JPEG or PNG image (NOT HEIC/WebP!)
 */

import fs from "fs";
import path from "path";
import { RekognitionClient, DetectLabelsCommand } from "@aws-sdk/client-rekognition";

// Validate environment
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

console.log("🔍 AWS Rekognition Smoke Test");
console.log("━".repeat(50));

if (!accessKeyId) {
  console.error("❌ ERROR: AWS_ACCESS_KEY_ID environment variable is not set");
  process.exit(1);
}

if (!secretAccessKey) {
  console.error("❌ ERROR: AWS_SECRET_ACCESS_KEY environment variable is not set");
  process.exit(1);
}

console.log(`📍 Region: ${region}`);

// Get image path from args
const imagePath = process.argv[2];
if (!imagePath) {
  console.error("❌ ERROR: Please provide a local image path");
  console.error("   Usage: node script/rekognition-smoke.mjs ./test.jpg");
  console.error("   NOTE: Image MUST be JPEG or PNG (not HEIC/WebP)");
  process.exit(1);
}

const fullPath = path.resolve(imagePath);
if (!fs.existsSync(fullPath)) {
  console.error(`❌ ERROR: File not found: ${fullPath}`);
  process.exit(1);
}

// Check file format by magic bytes
function detectImageFormat(bytes) {
  if (bytes.length < 8) return "unknown (too small)";
  
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return "jpeg";
  }
  
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return "png";
  }
  
  // HEIC: Check for ftyp at offset 4
  if (bytes.length >= 12 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    return "heic (NOT SUPPORTED!)";
  }
  
  // WebP: RIFF....WEBP
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes.length >= 12 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return "webp (NOT SUPPORTED!)";
  }
  
  return "unknown";
}

const imageBytes = fs.readFileSync(fullPath);
const format = detectImageFormat(imageBytes);

console.log(`📸 Image: ${fullPath}`);
console.log(`   Size: ${(imageBytes.length / 1024).toFixed(1)} KB`);
console.log(`   Format: ${format}`);

if (format.includes("NOT SUPPORTED")) {
  console.error(`\n❌ ERROR: ${format}`);
  console.error("   Rekognition ONLY supports JPEG and PNG images.");
  console.error("   Convert your image first:");
  console.error("   - macOS: sips -s format jpeg input.heic --out output.jpg");
  console.error("   - ImageMagick: convert input.heic output.jpg");
  console.error("   - Online: use an HEIC to JPEG converter");
  process.exit(1);
}

if (format === "unknown") {
  console.warn("\n⚠️  WARNING: Could not detect image format");
  console.warn("   Rekognition may fail if this is not JPEG/PNG");
}

const client = new RekognitionClient({
  region,
  credentials: { accessKeyId, secretAccessKey },
});

async function runTest() {
  console.log("\n⏳ Sending request to AWS Rekognition...\n");
  
  const startTime = Date.now();
  
  try {
    const command = new DetectLabelsCommand({
      Image: { Bytes: imageBytes },
      MaxLabels: 25,
      MinConfidence: 70,
    });
    
    const result = await client.send(command);
    const durationMs = Date.now() - startTime;
    
    const labels = result.Labels || [];
    
    if (labels.length === 0) {
      console.warn("⚠️  WARNING: Rekognition returned 0 labels!");
      console.warn("   This might indicate:");
      console.warn("   1. Image is corrupted or too small");
      console.warn("   2. Image is not actually JPEG/PNG (check magic bytes)");
      console.warn("   3. Image has no recognizable objects");
    } else {
      console.log("✅ SUCCESS! AWS Rekognition is working.\n");
      console.log("━".repeat(50));
      console.log(`DETECTED ${labels.length} LABELS:`);
      console.log("━".repeat(50));
      
      for (const label of labels) {
        const confidence = label.Confidence?.toFixed(1) || "N/A";
        console.log(`  • ${label.Name} (${confidence}%)`);
      }
      
      console.log("━".repeat(50));
    }
    
    console.log(`\n⏱️  Duration: ${durationMs}ms`);
    console.log(`📊 Labels found: ${labels.length}`);
    
  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error(`❌ ERROR after ${durationMs}ms:`, error.message);
    
    if (error.name === "InvalidParameterException") {
      console.error("\n   CAUSE: Invalid image data");
      console.error("   FIX: Ensure image is a valid JPEG or PNG file");
    } else if (error.name === "AccessDeniedException") {
      console.error("\n   CAUSE: AWS credentials don't have Rekognition access");
      console.error("   FIX: Check IAM permissions for rekognition:DetectLabels");
    } else if (error.name === "InvalidImageFormatException") {
      console.error("\n   CAUSE: Image format not supported");
      console.error("   FIX: Convert to JPEG or PNG (not HEIC/WebP)");
    } else if (error.name === "ImageTooLargeException") {
      console.error("\n   CAUSE: Image exceeds size limit");
      console.error("   FIX: Resize image (max 5MB for bytes, 15MB for S3)");
    }
    
    process.exit(1);
  }
}

runTest();
