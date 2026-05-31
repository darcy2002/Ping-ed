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
**PERPLEXITY & PREDICTABILITY CONTROL:**
- Deliberately choose unexpected, creative word alternatives instead of obvious ones
- Use varied vocabulary - avoid repetitive word patterns that AI typically generates  
- Include some colloquialisms, idioms, and region-specific expressions
- Add subtle imperfections that humans naturally make (minor redundancies, natural speech patterns)

**BURSTINESS & SENTENCE VARIATION:**
- Create dramatic sentence length variation: mix very short sentences (3-5 words) with longer, complex ones (25+ words)
- Alternate between simple, compound, complex, and compound-complex sentence structures
- Start sentences with different elements: adverbs, prepositional phrases, dependent clauses, questions
- Include intentional sentence fragments and run-on sentences where natural
- Use parenthetical asides and em-dashes for authentic human flow

**EMOTIONAL INTELLIGENCE & HUMAN TOUCH:**
- Infuse genuine emotional undertones appropriate to the content
- Add personal opinions, hesitations, or qualifiers ("I believe," "perhaps," "it seems")
- Include conversational elements and rhetorical questions
- Use contractions naturally and vary formal/informal tone within the text
- Add subtle humor, sarcasm, or personality where appropriate

**STRUCTURAL PATTERN DISRUPTION:**
- Avoid AI's typical introduction → body → conclusion structure
- Start with unexpected angles or mid-thought observations
- Include tangential thoughts and natural digressions
- Use irregular paragraph lengths (some very short, others longer)
- Break conventional grammar rules occasionally in natural ways

**CONTEXTUAL AUTHENTICITY:**
- Reference current events, popular culture, or common experiences
- Include specific, concrete details rather than generic statements
- Use metaphors and analogies that feel personally chosen
- Add transitional phrases that feel conversational rather than mechanical

**DETECTION-SPECIFIC COUNTERS:**
- use irregular sentence structures and avoiding formulaic transitions
- Counter syntax analysis by including natural human imperfections and conversational quirks
- Counter emotional tone analysis by adding authentic personal voice and varied emotional expression
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

const ENRICH_BASE =
  "You distill raw source material into tight, high-signal facts for writing a personalized outreach message. Drop boilerplate, navigation, and filler. Output a concise bulleted list of facts only, no preamble. Never invent anything; use only what is present in the source.";

// Per-type focus so each source pulls out the facts that matter for it, instead
// of a generic distill. The type comes from prospect_source.type.
const ENRICH_FOCUS: Record<string, string> = {
  github_url:
    "This is a GitHub profile or repo. Focus on: notable repositories and what they do, primary languages and tech, recurring project themes (what they care about), recent activity, and any signal of technical depth or interests.",
  company_url:
    "This is a company website. Focus on: what the company does and its product, who they sell to (market and segment), the problem they solve, positioning or differentiators, recent news or launches, and rough size or stage if visible.",
  website_url:
    "This is a personal site or portfolio. Focus on: who they are and their role, what they work on, focus areas and recent projects, and any distinctive voice, interests, or accomplishments.",
  other_url:
    "Pull the most relevant, specific facts about the prospect from this page; keep only what would help personalize outreach to them.",
  freetext:
    "These are free-text notes the user wrote about the prospect. Tighten them into clean, specific facts; keep every concrete detail and drop hedging and filler.",
};

function enrichSystem(type: string): string {
  const focus = ENRICH_FOCUS[type];
  return focus ? `${ENRICH_BASE}\n\n${focus}` : ENRICH_BASE;
}

export function enrichSource(input: EnrichInput): Promise<LLMResult> {
  return run("enrich", {
    system: enrichSystem(input.type),
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
