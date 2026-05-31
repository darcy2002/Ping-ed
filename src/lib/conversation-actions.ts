"use server";

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  conversation,
  message,
  offering,
  prompt,
  prospect,
} from "@/lib/schema";

export type Message = typeof message.$inferSelect;

export interface ConversationSummary {
  id: string;
  offeringName: string;
  promptName: string;
  dateLabel: string;
  messages: Message[];
}

export interface ProspectConversationGroup {
  prospectId: string;
  prospectName: string;
  conversations: ConversationSummary[];
}

function dateLabel(d: Date): string {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Load all messages for the given conversation ids in one query, grouped and
// ordered ascending per conversation.
async function messagesByConversation(
  ids: string[],
): Promise<Map<string, Message[]>> {
  const byConv = new Map<string, Message[]>();
  if (ids.length === 0) return byConv;
  const msgs = await db
    .select()
    .from(message)
    .where(inArray(message.conversationId, ids))
    .orderBy(asc(message.createdAt));
  for (const m of msgs) {
    const arr = byConv.get(m.conversationId);
    if (arr) arr.push(m);
    else byConv.set(m.conversationId, [m]);
  }
  return byConv;
}

async function assertConversationOwned(
  id: string,
  userId: string,
): Promise<void> {
  const rows = await db
    .select({ id: conversation.id })
    .from(conversation)
    .where(and(eq(conversation.id, id), eq(conversation.userId, userId)));

  if (!rows[0]) {
    throw new Error("Conversation not found");
  }
}

// Read-only: every conversation for a prospect (scoped to the user), each with
// the offering/prompt used, a date label, and its full ordered transcript.
export async function getProspectConversations(
  prospectId: string,
): Promise<ConversationSummary[]> {
  const userId = await getSessionUserId();

  const convs = await db
    .select({
      id: conversation.id,
      createdAt: conversation.createdAt,
      offeringName: offering.name,
      promptName: prompt.name,
    })
    .from(conversation)
    .innerJoin(offering, eq(conversation.offeringId, offering.id))
    .innerJoin(prompt, eq(conversation.promptId, prompt.id))
    .where(
      and(
        eq(conversation.prospectId, prospectId),
        eq(conversation.userId, userId),
      ),
    )
    .orderBy(desc(conversation.createdAt));

  if (convs.length === 0) return [];

  const byConv = await messagesByConversation(convs.map((c) => c.id));

  return convs.map((c) => ({
    id: c.id,
    offeringName: c.offeringName,
    promptName: c.promptName,
    dateLabel: dateLabel(c.createdAt),
    messages: byConv.get(c.id) ?? [],
  }));
}

// Read-only: every conversation the user owns, grouped by prospect (prospects
// ordered by their most recent conversation). Powers the Conversations tab.
export async function getConversationsByProspect(): Promise<
  ProspectConversationGroup[]
> {
  const userId = await getSessionUserId();

  const convs = await db
    .select({
      id: conversation.id,
      createdAt: conversation.createdAt,
      prospectId: conversation.prospectId,
      prospectName: prospect.name,
      offeringName: offering.name,
      promptName: prompt.name,
    })
    .from(conversation)
    .innerJoin(prospect, eq(conversation.prospectId, prospect.id))
    .innerJoin(offering, eq(conversation.offeringId, offering.id))
    .innerJoin(prompt, eq(conversation.promptId, prompt.id))
    .where(eq(conversation.userId, userId))
    .orderBy(desc(conversation.createdAt));

  if (convs.length === 0) return [];

  const byConv = await messagesByConversation(convs.map((c) => c.id));

  const groups = new Map<string, ProspectConversationGroup>();
  for (const c of convs) {
    const summary: ConversationSummary = {
      id: c.id,
      offeringName: c.offeringName,
      promptName: c.promptName,
      dateLabel: dateLabel(c.createdAt),
      messages: byConv.get(c.id) ?? [],
    };
    const g = groups.get(c.prospectId);
    if (g) g.conversations.push(summary);
    else
      groups.set(c.prospectId, {
        prospectId: c.prospectId,
        prospectName: c.prospectName,
        conversations: [summary],
      });
  }
  return [...groups.values()];
}

// The full thread in chronological order — outreach first, then replies.
export async function getConversationThread(
  conversationId: string,
): Promise<Message[]> {
  const userId = await getSessionUserId();
  await assertConversationOwned(conversationId, userId);

  return db
    .select()
    .from(message)
    .where(eq(message.conversationId, conversationId))
    .orderBy(asc(message.createdAt));
}

export async function addProspectReply(
  conversationId: string,
  content: string,
): Promise<Message> {
  const userId = await getSessionUserId();
  await assertConversationOwned(conversationId, userId);

  const text = content.trim();
  if (!text) {
    throw new Error("Reply cannot be empty");
  }

  // model is NOT NULL but a pasted reply isn't model-generated.
  const [row] = await db
    .insert(message)
    .values({
      conversationId,
      role: "prospect_reply",
      content: text,
      model: "",
    })
    .returning();
  return row;
}
