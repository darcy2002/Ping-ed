// The only AI surface the rest of the app imports. Owns prompt construction;
// knows nothing about providers — everything goes through the gateway.

import { run } from "./gateway";
import type { LLMMessage, LLMResult } from "./types";

export interface ThreadTurn {
  role: "outreach" | "prospect_reply";
  content: string;
}

export interface OutreachInput {
  systemPrompt: string;
  offering: string;
  prospect: string;
  angle?: string;
}

export interface ReplyInput {
  systemPrompt: string;
  offering: string;
  prospect: string;
  thread: ThreadTurn[];
  angle?: string;
}

export interface EnrichInput {
  type: string;
  content: string;
}

export interface ScreenshotInput {
  mediaType: string;
  dataBase64: string;
  hint?: string;
}

export interface ExplainInput {
  subject: string;
  context?: string;
}

// Thin, fixed envelope that governs FORMAT ONLY. It must never override the
// tone/length/angle the user instructed in their own system prompt.
const FORMAT_RULES =
  "Output only the message. No preamble, no subject line, no quotes. Write in first person as the sender. Don't explain choices.";

// Anti-AI-tell rules, appended to the fixed envelope for message generation
// (outreach + reply) only — never for enrich/vision/explain. Scoped to short
// messages: no long-form rules about headers, bold, or lists.
const HUMANIZE_RULES = `Write like a real person, not an AI. Avoid these tells:
- No significance inflation or promotional language ("pivotal moment", "nestled", "breathtaking").
- No AI vocabulary: testament, landscape, showcasing, delve, robust, leverage, elevate, foster, seamless, unlock, navigate.
- Use plain verbs ("is", "has") instead of "serves as", "boasts", "features".
- No negative parallelisms ("it's not just X, it's Y").
- No rule-of-three lists, and no forced triads.
- Never use em dashes (—) or en dashes (–) anywhere. Use commas, periods, or rewrite the sentence.
- Never restate the prospect's role or job title back to them.
- Open with one specific thing they did, not their title.
- No signposting openers ("let's dive in", "here's what you need to know").
- Cut filler ("in order to" -> "to", "due to the fact that" -> "because").
- No excessive hedging ("could potentially possibly").
- No generic conclusions ("the future looks bright").
- No sycophancy and no exclamation-mark enthusiasm.
After drafting, silently re-read the message against these rules and rewrite any line that slipped in. CRITICAL: keep the specific, personalized details about the prospect intact — do NOT sand the message into generic clean text. Human and specific beats clean and generic.`;

function systemWithEnvelope(systemPrompt: string): string {
  return `${systemPrompt}\n\n---\n${FORMAT_RULES}\n\n${HUMANIZE_RULES}`;
}

// Deterministic guarantee that no dashes survive, even if the model ignores the
// rule: replace every em/en dash with a comma, then normalise spacing so there
// is no leading space before a comma, no doubled spaces, and no ", ," runs.
function stripDashes(text: string): string {
  return text
    .replace(/[—–]/g, ",") // em/en dash -> comma
    .replace(/[ \t]+,/g, ",") // no space before a comma
    .replace(/,(?:[ \t]*,)+/g, ",") // collapse ",," / ", ," runs into one comma
    .replace(/,(?=\S)/g, ", ") // ensure a single space after a comma
    .replace(/[ \t]{2,}/g, " ") // no double spaces
    .replace(/[ \t]+\n/g, "\n") // drop trailing spaces on each line
    .trim();
}

function contextBlocks(
  offering: string,
  prospect: string,
  angle?: string,
): string {
  const blocks = [
    `<offering>\n${offering}\n</offering>`,
    `<prospect>\n${prospect}\n</prospect>`,
  ];
  if (angle) {
    blocks.push(`<angle>\n${angle}\n</angle>`);
  }
  return blocks.join("\n\n");
}

export async function generateOutreach(
  input: OutreachInput,
): Promise<LLMResult> {
  const result = await run("outreach", {
    system: systemWithEnvelope(input.systemPrompt),
    messages: [
      {
        role: "user",
        content: contextBlocks(input.offering, input.prospect, input.angle),
      },
    ],
  });
  return { ...result, text: stripDashes(result.text) };
}

// A reply is the same call with the full thread as history, so the follow-up
// reads as a continuation rather than a fresh message.
export async function generateReply(input: ReplyInput): Promise<LLMResult> {
  const messages: LLMMessage[] = [
    {
      role: "user",
      content: contextBlocks(input.offering, input.prospect, input.angle),
    },
  ];
  for (const turn of input.thread) {
    messages.push({
      role: turn.role === "outreach" ? "assistant" : "user",
      content: turn.content,
    });
  }
  const result = await run("reply", {
    system: systemWithEnvelope(input.systemPrompt),
    messages,
  });
  return { ...result, text: stripDashes(result.text) };
}

const ENRICH_SYSTEM =
  "You distill raw source material into tight, high-signal facts for writing a personalized outreach message. Extract concrete, specific details (role, focus, projects, achievements, interests, recent activity). Drop boilerplate, navigation, and filler. Output a concise bulleted list of facts only — no preamble.";

export function enrichSource(input: EnrichInput): Promise<LLMResult> {
  return run("enrich", {
    system: ENRICH_SYSTEM,
    messages: [
      {
        role: "user",
        content: `<source type="${input.type}">\n${input.content}\n</source>`,
      },
    ],
  });
}

const VISION_SYSTEM =
  "You read a LinkedIn profile screenshot and extract tight, high-signal facts for personalized outreach: name, headline/role, company, location, focus areas, notable experience, and anything distinctive. Output a concise bulleted list of facts only — no preamble. Omit anything you cannot read.";

export function extractFromScreenshot(
  input: ScreenshotInput,
): Promise<LLMResult> {
  const text = input.hint
    ? `Read this LinkedIn screenshot and extract the profile facts. Context: ${input.hint}`
    : "Read this LinkedIn screenshot and extract the profile facts.";
  return run("vision", {
    system: VISION_SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text },
          {
            type: "image",
            mediaType: input.mediaType,
            dataBase64: input.dataBase64,
          },
        ],
      },
    ],
  });
}

const EXPLAIN_SYSTEM =
  "You are an inline helper inside an outreach tool. In 1-2 plain, friendly sentences, explain what the user is looking at and why it matters. No jargon, no preamble, no lists.";

export function explainInline(input: ExplainInput): Promise<LLMResult> {
  const content = input.context
    ? `Explain: ${input.subject}\n\nContext:\n${input.context}`
    : `Explain: ${input.subject}`;
  return run("explain", {
    system: EXPLAIN_SYSTEM,
    messages: [{ role: "user", content }],
  });
}
