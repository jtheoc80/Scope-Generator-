#!/usr/bin/env node
/**
 * OpenAI Vision Smoke Test
 * 
 * This script validates that your OpenAI Vision integration is working correctly.
 * Run this to isolate whether the "no summary" issue is related to OpenAI.
 * 
 * Usage:
 *   node script/openai-vision-smoke.mjs ./test.jpg
 *   node script/openai-vision-smoke.mjs https://example.com/image.jpg
 * 
 * Prerequisites:
 *   - OPENAI_API_KEY environment variable set
 *   - A test JPEG or PNG image
 */

import fs from "fs";
import path from "path";
import OpenAI from "openai";

// Validate environment
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("❌ ERROR: OPENAI_API_KEY environment variable is not set");
  console.error("   Set it with: export OPENAI_API_KEY=sk-...");
  process.exit(1);
}

// Get image path from args
const imagePath = process.argv[2];
if (!imagePath) {
  console.error("❌ ERROR: Please provide an image path or URL");
  console.error("   Usage: node script/openai-vision-smoke.mjs ./test.jpg");
  console.error("          node script/openai-vision-smoke.mjs https://example.com/image.jpg");
  process.exit(1);
}

console.log("🔍 OpenAI Vision Smoke Test");
console.log("━".repeat(50));

const openai = new OpenAI({ apiKey });

async function runTest() {
  let imageUrl;
  
  // Handle URL vs local file
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    imageUrl = imagePath;
    console.log(`📸 Using remote image: ${imagePath}`);
  } else {
    // Local file - read and convert to base64
    const fullPath = path.resolve(imagePath);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ ERROR: File not found: ${fullPath}`);
      process.exit(1);
    }
    
    const ext = path.extname(fullPath).toLowerCase();
    if (![".jpg", ".jpeg", ".png"].includes(ext)) {
      console.error(`❌ ERROR: Unsupported image format: ${ext}`);
      console.error("   OpenAI Vision works best with JPEG/PNG images");
      console.error("   If you have HEIC (iPhone), convert it first");
      process.exit(1);
    }
    
    const imageData = fs.readFileSync(fullPath);
    const base64Image = imageData.toString("base64");
    const mimeType = ext === ".png" ? "image/png" : "image/jpeg";
    imageUrl = `data:${mimeType};base64,${base64Image}`;
    
    console.log(`📸 Using local image: ${fullPath}`);
    console.log(`   Size: ${(imageData.length / 1024).toFixed(1)} KB`);
    console.log(`   Format: ${mimeType}`);
  }
  
  console.log("\n⏳ Sending request to OpenAI Vision...\n");
  
  const startTime = Date.now();
  
  try {
    // Using Chat Completions API (the standard approach)
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this photo for a contractor proposal. Return 5 bullet observations about what you see, focusing on any issues, damage, or work that might need to be done.",
            },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      max_tokens: 500,
    });
    
    const durationMs = Date.now() - startTime;
    
    // Extract the response content
    const content = response.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error("❌ ERROR: OpenAI returned empty content!");
      console.error("   Response structure:", JSON.stringify(response, null, 2));
      console.error("\n   COMMON CAUSES:");
      console.error("   1. Invalid API key");
      console.error("   2. Rate limiting");
      console.error("   3. Image too large or corrupted");
      process.exit(1);
    }
    
    console.log("✅ SUCCESS! OpenAI Vision is working.\n");
    console.log("━".repeat(50));
    console.log("RESPONSE:");
    console.log("━".repeat(50));
    console.log(content);
    console.log("━".repeat(50));
    console.log(`\n⏱️  Duration: ${durationMs}ms`);
    console.log(`📊 Model: ${response.model}`);
    console.log(`🔢 Tokens: ${response.usage?.total_tokens || "N/A"}`);
    console.log(`✅ Finish reason: ${response.choices?.[0]?.finish_reason}`);
    
  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error(`❌ ERROR after ${durationMs}ms:`, error.message);
    
    if (error.status === 401) {
      console.error("\n   CAUSE: Invalid API key");
      console.error("   FIX: Check your OPENAI_API_KEY environment variable");
    } else if (error.status === 429) {
      console.error("\n   CAUSE: Rate limit exceeded");
      console.error("   FIX: Wait a moment and try again, or check your usage limits");
    } else if (error.status === 400 && error.message?.includes("image")) {
      console.error("\n   CAUSE: Image format issue");
      console.error("   FIX: Ensure image is JPEG or PNG, not HEIC/WebP");
    }
    
    process.exit(1);
  }
}

runTest();
