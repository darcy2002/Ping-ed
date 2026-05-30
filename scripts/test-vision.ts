// Throwaway harness: prove extractFromScreenshot reads a real LinkedIn
// screenshot via the vision task. Run with:
//   tsx scripts/test-vision.ts <path-to-image>

import { readFileSync } from "node:fs";
import { extname } from "node:path";
import { extractFromScreenshot } from "../src/ai/tasks";

try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local — rely on whatever is already in the environment.
}

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

async function main() {
  const imagePath = process.argv[2] ?? "scripts/sample-linkedin.png";

  const mediaType = MIME[extname(imagePath).toLowerCase()] ?? "image/png";
  const dataBase64 = readFileSync(imagePath).toString("base64");

  const result = await extractFromScreenshot({ mediaType, dataBase64 });

  console.log(
    `\n--- model: ${result.model} | provider: ${result.provider} ---\n`,
  );
  console.log(result.text.trim());
  console.log(`\n--- usage: ${JSON.stringify(result.usage)} ---`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
