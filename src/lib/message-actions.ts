"use server";

import { and, eq } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversation, message } from "@/lib/schema";

export type Message = typeof message.$inferSelect;

// A message is owned transitively through its parent conversation.
async function assertMessageOwned(
  id: string,
  userId: string,
): Promise<void> {
  const rows = await db
    .select({ id: message.id })
    .from(message)
    .innerJoin(conversation, eq(message.conversationId, conversation.id))
    .where(and(eq(message.id, id), eq(conversation.userId, userId)));

  if (!rows[0]) {
    throw new Error("Message not found");
  }
}

export async function rateMessage(
  id: string,
  rating: number | null,
): Promise<Message> {
  const userId = await getSessionUserId();
  await assertMessageOwned(id, userId);

  const [row] = await db
    .update(message)
    .set({ rating, updatedAt: new Date() })
    .where(eq(message.id, id))
    .returning();
  return row;
}

export async function setMessageFavourite(
  id: string,
  isFavourite: boolean,
): Promise<Message> {
  const userId = await getSessionUserId();
  await assertMessageOwned(id, userId);

  const [row] = await db
    .update(message)
    .set({ isFavourite, updatedAt: new Date() })
    .where(eq(message.id, id))
    .returning();
  return row;
}

export async function deleteMessage(id: string): Promise<void> {
  const userId = await getSessionUserId();
  await assertMessageOwned(id, userId);

  await db.delete(message).where(eq(message.id, id));
}
