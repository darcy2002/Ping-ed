"use server";

import { and, asc, eq } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversation, message } from "@/lib/schema";

export type Message = typeof message.$inferSelect;

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
