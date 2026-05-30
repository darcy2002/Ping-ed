"use server";

import { and, desc, eq } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { offering } from "@/lib/schema";

export type Offering = typeof offering.$inferSelect;

export interface CreateOfferingInput {
  name: string;
  sourceUrl?: string | null;
  content?: string;
}

export interface UpdateOfferingInput {
  name?: string;
  sourceUrl?: string | null;
  content?: string;
}

export async function listOfferings(): Promise<Offering[]> {
  const userId = await getSessionUserId();
  return db
    .select()
    .from(offering)
    .where(eq(offering.userId, userId))
    .orderBy(desc(offering.updatedAt));
}

export async function getOffering(id: string): Promise<Offering> {
  const userId = await getSessionUserId();
  const rows = await db
    .select()
    .from(offering)
    .where(and(eq(offering.id, id), eq(offering.userId, userId)));

  const row = rows[0];
  if (!row) {
    throw new Error("Offering not found");
  }
  return row;
}

export async function createOffering(
  input: CreateOfferingInput,
): Promise<Offering> {
  const userId = await getSessionUserId();

  const name = input.name.trim();
  if (!name) {
    throw new Error("Offering name is required");
  }

  const rows = await db
    .insert(offering)
    .values({
      userId,
      name,
      sourceUrl: input.sourceUrl ?? null,
      ...(input.content !== undefined && { content: input.content }),
    })
    .returning();

  return rows[0];
}

export async function updateOffering(
  id: string,
  input: UpdateOfferingInput,
): Promise<Offering> {
  const userId = await getSessionUserId();

  const name = input.name?.trim();
  if (name !== undefined && name === "") {
    throw new Error("Offering name is required");
  }

  const rows = await db
    .update(offering)
    .set({
      ...(name !== undefined && { name }),
      ...(input.sourceUrl !== undefined && { sourceUrl: input.sourceUrl }),
      ...(input.content !== undefined && { content: input.content }),
      updatedAt: new Date(),
    })
    .where(and(eq(offering.id, id), eq(offering.userId, userId)))
    .returning();

  const row = rows[0];
  if (!row) {
    throw new Error("Offering not found");
  }
  return row;
}

export async function deleteOffering(id: string): Promise<void> {
  const userId = await getSessionUserId();

  const rows = await db
    .delete(offering)
    .where(and(eq(offering.id, id), eq(offering.userId, userId)))
    .returning({ id: offering.id });

  if (!rows[0]) {
    throw new Error("Offering not found");
  }
}
