"use server";

import { and, desc, eq } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  prospect,
  prospectSource,
  prospectSourceStatusEnum,
  prospectSourceTypeEnum,
} from "@/lib/schema";

export type Prospect = typeof prospect.$inferSelect;
export type ProspectSource = typeof prospectSource.$inferSelect;
export type ProspectSourceType = (typeof prospectSourceTypeEnum.enumValues)[number];
export type ProspectSourceStatus =
  (typeof prospectSourceStatusEnum.enumValues)[number];
export type ProspectWithSources = Prospect & { sources: ProspectSource[] };

export interface ProspectSourceInput {
  type: ProspectSourceType;
  value: string;
}

export interface CreateProspectInput {
  name: string;
  sources?: ProspectSourceInput[];
}

export interface UpdateProspectSourceInput {
  type?: ProspectSourceType;
  value?: string;
  extractedContext?: string | null;
  status?: ProspectSourceStatus;
}

// Confirms the prospect exists and belongs to the user, or throws.
async function assertProspectOwned(
  prospectId: string,
  userId: string,
): Promise<void> {
  const rows = await db
    .select({ id: prospect.id })
    .from(prospect)
    .where(and(eq(prospect.id, prospectId), eq(prospect.userId, userId)));

  if (!rows[0]) {
    throw new Error("Prospect not found");
  }
}

// A source is owned transitively through its parent prospect.
async function assertSourceOwned(
  sourceId: string,
  userId: string,
): Promise<void> {
  const rows = await db
    .select({ id: prospectSource.id })
    .from(prospectSource)
    .innerJoin(prospect, eq(prospectSource.prospectId, prospect.id))
    .where(and(eq(prospectSource.id, sourceId), eq(prospect.userId, userId)));

  if (!rows[0]) {
    throw new Error("Source not found");
  }
}

export async function listProspects(): Promise<Prospect[]> {
  const userId = await getSessionUserId();
  return db
    .select()
    .from(prospect)
    .where(eq(prospect.userId, userId))
    .orderBy(desc(prospect.updatedAt));
}

export async function getProspect(id: string): Promise<ProspectWithSources> {
  const userId = await getSessionUserId();

  const rows = await db
    .select()
    .from(prospect)
    .where(and(eq(prospect.id, id), eq(prospect.userId, userId)));

  const row = rows[0];
  if (!row) {
    throw new Error("Prospect not found");
  }

  const sources = await db
    .select()
    .from(prospectSource)
    .where(eq(prospectSource.prospectId, id))
    .orderBy(desc(prospectSource.createdAt));

  return { ...row, sources };
}

export async function createProspect(
  input: CreateProspectInput,
): Promise<ProspectWithSources> {
  const userId = await getSessionUserId();

  const name = input.name.trim();
  if (!name) {
    throw new Error("Prospect name is required");
  }

  const sourceValues = (input.sources ?? [])
    .map((source) => ({ type: source.type, value: source.value.trim() }))
    .filter((source) => source.value !== "");

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(prospect)
      .values({ userId, name })
      .returning();

    let sources: ProspectSource[] = [];
    if (sourceValues.length > 0) {
      sources = await tx
        .insert(prospectSource)
        .values(
          sourceValues.map((source) => ({
            prospectId: created.id,
            type: source.type,
            value: source.value,
          })),
        )
        .returning();
    }

    return { ...created, sources };
  });
}

export async function updateProspect(
  id: string,
  input: { name: string },
): Promise<Prospect> {
  const userId = await getSessionUserId();

  const name = input.name.trim();
  if (!name) {
    throw new Error("Prospect name is required");
  }

  const rows = await db
    .update(prospect)
    .set({ name, updatedAt: new Date() })
    .where(and(eq(prospect.id, id), eq(prospect.userId, userId)))
    .returning();

  const row = rows[0];
  if (!row) {
    throw new Error("Prospect not found");
  }
  return row;
}

export async function deleteProspect(id: string): Promise<void> {
  const userId = await getSessionUserId();

  const rows = await db
    .delete(prospect)
    .where(and(eq(prospect.id, id), eq(prospect.userId, userId)))
    .returning({ id: prospect.id });

  if (!rows[0]) {
    throw new Error("Prospect not found");
  }
}

export async function addProspectSource(
  prospectId: string,
  input: ProspectSourceInput,
): Promise<ProspectSource> {
  const userId = await getSessionUserId();
  await assertProspectOwned(prospectId, userId);

  const value = input.value.trim();
  if (!value) {
    throw new Error("Source value is required");
  }

  const [created] = await db
    .insert(prospectSource)
    .values({ prospectId, type: input.type, value })
    .returning();

  return created;
}

export async function updateProspectSource(
  id: string,
  input: UpdateProspectSourceInput,
): Promise<ProspectSource> {
  const userId = await getSessionUserId();
  await assertSourceOwned(id, userId);

  const value = input.value?.trim();
  if (value !== undefined && value === "") {
    throw new Error("Source value is required");
  }

  const rows = await db
    .update(prospectSource)
    .set({
      ...(input.type !== undefined && { type: input.type }),
      ...(value !== undefined && { value }),
      ...(input.extractedContext !== undefined && {
        extractedContext: input.extractedContext,
      }),
      ...(input.status !== undefined && { status: input.status }),
      updatedAt: new Date(),
    })
    .where(eq(prospectSource.id, id))
    .returning();

  return rows[0];
}

export async function deleteProspectSource(id: string): Promise<void> {
  const userId = await getSessionUserId();
  await assertSourceOwned(id, userId);

  await db.delete(prospectSource).where(eq(prospectSource.id, id));
}
