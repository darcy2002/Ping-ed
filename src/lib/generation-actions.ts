"use server";

import { and, asc, desc, eq } from "drizzle-orm";
import { generateOutreach, generateReply } from "@/ai/tasks";
import { LLMError } from "@/ai/types";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  conversation,
  message,
  offering,
  prompt,
  prospect,
  prospectSource,
} from "@/lib/schema";

export type Message = typeof message.$inferSelect;

export interface GenerateOutreachInput {
  offeringId: string;
  promptId: string;
  prospectId: string;
  // Optional steer for regenerate — wrapped as an <angle> block in assembly.
  angle?: string;
}

// Returned (not thrown) so the real message survives Next's production error
// masking and can be shown in the UI.
export type GenerateOutreachResult =
  | { ok: true; conversationId: string; message: Message }
  | { ok: false; error: string };

function errorMessage(err: unknown): string {
  if (err instanceof LLMError) {
    const snippet =
      typeof err.body === "string" ? err.body.slice(0, 300).trim() : "";
    return `AI provider error (${err.provider}, status ${err.status})${
      snippet ? `: ${snippet}` : ""
    }`;
  }
  return err instanceof Error ? err.message : "Generation failed.";
}

const SOURCE_LABELS: Record<string, string> = {
  linkedin_screenshot: "LinkedIn",
  github_url: "GitHub",
  website_url: "Website",
  company_url: "Company",
  other_url: "Link",
  freetext: "Note",
};

// Assemble already-distilled source context into a single prospect block.
// Generation never re-scrapes — it only stitches together extracted_context.
function buildProspectContext(
  name: string,
  sources: { type: string; extractedContext: string | null; status: string }[],
): string {
  const enriched = sources.filter(
    (s) => s.status === "enriched" && s.extractedContext?.trim(),
  );

  const blocks = enriched.map((s) => {
    const label = SOURCE_LABELS[s.type] ?? s.type;
    return `[${label}]\n${s.extractedContext!.trim()}`;
  });

  return [`Name: ${name}`, ...blocks].join("\n\n");
}

export async function generateOutreachMessage(
  input: GenerateOutreachInput,
): Promise<GenerateOutreachResult> {
  try {
    const userId = await getSessionUserId();

    const [offeringRow] = await db
      .select()
      .from(offering)
      .where(
        and(eq(offering.id, input.offeringId), eq(offering.userId, userId)),
      );
    if (!offeringRow) throw new Error("Offering not found");

    const [promptRow] = await db
      .select()
      .from(prompt)
      .where(and(eq(prompt.id, input.promptId), eq(prompt.userId, userId)));
    if (!promptRow) throw new Error("Prompt not found");

    const [prospectRow] = await db
      .select()
      .from(prospect)
      .where(
        and(eq(prospect.id, input.prospectId), eq(prospect.userId, userId)),
      );
    if (!prospectRow) throw new Error("Prospect not found");

    const sources = await db
      .select({
        type: prospectSource.type,
        extractedContext: prospectSource.extractedContext,
        status: prospectSource.status,
      })
      .from(prospectSource)
      .where(eq(prospectSource.prospectId, prospectRow.id))
      .orderBy(desc(prospectSource.createdAt));

    const prospectContext = buildProspectContext(prospectRow.name, sources);
    const angle = input.angle?.trim() || undefined;

    const result = await generateOutreach({
      systemPrompt: promptRow.systemPrompt,
      offering: offeringRow.content || offeringRow.name,
      prospect: prospectContext,
      angle,
    });

    const saved = await db.transaction(async (tx) => {
      const [conv] = await tx
        .insert(conversation)
        .values({
          userId,
          prospectId: prospectRow.id,
          offeringId: offeringRow.id,
          promptId: promptRow.id,
        })
        .returning();

      const [msg] = await tx
        .insert(message)
        .values({
          conversationId: conv.id,
          role: "outreach",
          content: result.text,
          model: result.model,
          ...(angle && { angle }),
        })
        .returning();

      return { conversationId: conv.id, message: msg };
    });

    return { ok: true, ...saved };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

// A follow-up is the SAME generation call with history: the entire prior thread
// (in order) is replayed as the messages array, plus the same offering/prospect
// context. The output is the next role=outreach message in the conversation.
export async function generateReplyMessage(
  conversationId: string,
): Promise<GenerateOutreachResult> {
  try {
    const userId = await getSessionUserId();

    const [conv] = await db
      .select()
      .from(conversation)
      .where(
        and(
          eq(conversation.id, conversationId),
          eq(conversation.userId, userId),
        ),
      );
    if (!conv) throw new Error("Conversation not found");

    const [offeringRow] = await db
      .select()
      .from(offering)
      .where(eq(offering.id, conv.offeringId));
    if (!offeringRow) throw new Error("Offering not found");

    const [promptRow] = await db
      .select()
      .from(prompt)
      .where(eq(prompt.id, conv.promptId));
    if (!promptRow) throw new Error("Prompt not found");

    const [prospectRow] = await db
      .select()
      .from(prospect)
      .where(eq(prospect.id, conv.prospectId));
    if (!prospectRow) throw new Error("Prospect not found");

    const sources = await db
      .select({
        type: prospectSource.type,
        extractedContext: prospectSource.extractedContext,
        status: prospectSource.status,
      })
      .from(prospectSource)
      .where(eq(prospectSource.prospectId, prospectRow.id))
      .orderBy(desc(prospectSource.createdAt));

    const prospectContext = buildProspectContext(prospectRow.name, sources);

    const thread = await db
      .select({ role: message.role, content: message.content })
      .from(message)
      .where(eq(message.conversationId, conversationId))
      .orderBy(asc(message.createdAt));

    const result = await generateReply({
      systemPrompt: promptRow.systemPrompt,
      offering: offeringRow.content || offeringRow.name,
      prospect: prospectContext,
      thread,
    });

    const [msg] = await db
      .insert(message)
      .values({
        conversationId,
        role: "outreach",
        content: result.text,
        model: result.model,
      })
      .returning();

    return { ok: true, conversationId, message: msg };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}
