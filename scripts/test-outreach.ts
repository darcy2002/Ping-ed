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
      "Write a cold outreach message under 70 words in a casual, peer-to-peer tone. Open with ONE specific, genuine observation about the prospect from their context — not flattery. Connect it to the offering in one natural sentence, like someone who actually uses it would say it. Never sound salesy: no buzzwords, no corporate-speak, no feature lists, and never invent numbers or claims not in the context. End with a low-pressure question. Write like you'd message a peer you respect.",
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
