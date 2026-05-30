// Throwaway harness: prove generateOutreach produces a real, personalized
// message. Run with: tsx scripts/test-outreach.ts

import { generateOutreach } from "../src/ai/tasks";

try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local — rely on whatever is already in the environment.
}

async function main() {
  const result = await generateOutreach({
    systemPrompt:
      "You are warm, concise, and specific. Write a 4-6 sentence LinkedIn connection note. No buzzwords, no flattery. Reference one concrete detail about the prospect. End with a single low-friction question.",
    offering:
      "Pinged — an AI tool that writes hyper-personalized outreach from a prospect's public footprint (GitHub, site, LinkedIn). Saves reps ~30 minutes per message and lifts reply rates.",
    prospect: [
      "- Priya Nair",
      "- Head of Growth at a Series B fintech in Bangalore",
      "- Recently posted about cutting CAC with lifecycle email",
      "- Ex-founder; cares about lean, high-signal tooling",
      "- Active on LinkedIn, shares growth experiments",
    ].join("\n"),
  });

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
