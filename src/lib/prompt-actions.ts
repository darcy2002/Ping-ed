"use server";

import { and, desc, eq, ne } from "drizzle-orm";
import { explainInline } from "@/ai/tasks";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { prompt } from "@/lib/schema";

export type Prompt = typeof prompt.$inferSelect;

export interface CreatePromptInput {
  name: string;
  systemPrompt: string;
  isDefault?: boolean;
}

export interface UpdatePromptInput {
  name?: string;
  systemPrompt?: string;
  isDefault?: boolean;
}

export async function listPrompts(): Promise<Prompt[]> {
  const userId = await getSessionUserId();
  return db
    .select()
    .from(prompt)
    .where(eq(prompt.userId, userId))
    .orderBy(desc(prompt.isDefault), desc(prompt.updatedAt));
}

export async function getPrompt(id: string): Promise<Prompt> {
  const userId = await getSessionUserId();
  const rows = await db
    .select()
    .from(prompt)
    .where(and(eq(prompt.id, id), eq(prompt.userId, userId)));

  const row = rows[0];
  if (!row) {
    throw new Error("Prompt not found");
  }
  return row;
}

export async function createPrompt(input: CreatePromptInput): Promise<Prompt> {
  const userId = await getSessionUserId();

  const name = input.name.trim();
  if (!name) {
    throw new Error("Prompt name is required");
  }
  const systemPrompt = input.systemPrompt.trim();
  if (!systemPrompt) {
    throw new Error("System prompt is required");
  }

  const rows = await db.transaction(async (tx) => {
    // Keep a single default per user.
    if (input.isDefault) {
      await tx
        .update(prompt)
        .set({ isDefault: false })
        .where(eq(prompt.userId, userId));
    }
    return tx
      .insert(prompt)
      .values({
        userId,
        name,
        systemPrompt,
        ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
      })
      .returning();
  });

  return rows[0];
}

export async function updatePrompt(
  id: string,
  input: UpdatePromptInput,
): Promise<Prompt> {
  const userId = await getSessionUserId();

  const name = input.name?.trim();
  if (name !== undefined && name === "") {
    throw new Error("Prompt name is required");
  }
  const systemPrompt = input.systemPrompt?.trim();
  if (systemPrompt !== undefined && systemPrompt === "") {
    throw new Error("System prompt is required");
  }

  const rows = await db.transaction(async (tx) => {
    if (input.isDefault === true) {
      await tx
        .update(prompt)
        .set({ isDefault: false })
        .where(and(eq(prompt.userId, userId), ne(prompt.id, id)));
    }
    return tx
      .update(prompt)
      .set({
        ...(name !== undefined && { name }),
        ...(systemPrompt !== undefined && { systemPrompt }),
        ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
        updatedAt: new Date(),
      })
      .where(and(eq(prompt.id, id), eq(prompt.userId, userId)))
      .returning();
  });

  const row = rows[0];
  if (!row) {
    throw new Error("Prompt not found");
  }
  return row;
}

export async function deletePrompt(id: string): Promise<void> {
  const userId = await getSessionUserId();

  const rows = await db
    .delete(prompt)
    .where(and(eq(prompt.id, id), eq(prompt.userId, userId)))
    .returning({ id: prompt.id });

  if (!rows[0]) {
    throw new Error("Prompt not found");
  }
}

export async function setDefaultPrompt(id: string): Promise<void> {
  const userId = await getSessionUserId();

  await db.transaction(async (tx) => {
    await tx
      .update(prompt)
      .set({ isDefault: false })
      .where(and(eq(prompt.userId, userId), ne(prompt.id, id)));

    const rows = await tx
      .update(prompt)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(and(eq(prompt.id, id), eq(prompt.userId, userId)))
      .returning({ id: prompt.id });

    if (!rows[0]) {
      throw new Error("Prompt not found");
    }
  });
}

const STARTER_PRESETS: Array<{ name: string; systemPrompt: string }> = [
  {
    name: "Casual founder",
    systemPrompt:
      "Write a short cold outreach message (under 70 words) in a warm, casual, founder-to-founder tone. Open with ONE specific, genuine observation drawn from the prospect's context — not flattery. Connect it to the offering in a single natural sentence, the way someone who actually uses it would say it. No buzzwords, no corporate-speak, no feature lists, and never invent facts or numbers. End with a low-pressure question.",
  },
  {
    name: "Technical peer",
    systemPrompt:
      "Write a concise outreach message (under 90 words) from one engineer to another. Be specific and credible: reference a concrete technical detail from the prospect's context and show you understand it. Tie the offering to a real problem they likely face, plainly and without hype. No marketing language, no exclamation points, no invented metrics. Close with a direct, low-friction question.",
  },
  {
    name: "Formal",
    systemPrompt:
      "Write a polished, professional outreach message (under 110 words) in a respectful, businesslike tone. Reference a specific, relevant detail about the prospect to show genuine research. Clearly and succinctly connect the offering to their context and likely priorities. Avoid slang and over-familiarity; avoid hype and unverifiable claims. End with a courteous call to a brief conversation.",
  },
];

// Seed a few starter prompts the first time a user visits, so they always have
// something to generate with. No-op once any prompt exists.
export async function seedStarterPrompts(): Promise<void> {
  const userId = await getSessionUserId();

  const existing = await db
    .select({ id: prompt.id })
    .from(prompt)
    .where(eq(prompt.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return;
  }

  await db.insert(prompt).values(
    STARTER_PRESETS.map((preset, index) => ({
      userId,
      name: preset.name,
      systemPrompt: preset.systemPrompt,
      isDefault: index === 0,
    })),
  );
}

export async function explainPrompt(): Promise<string> {
  await getSessionUserId();

  const result = await explainInline({
    subject:
      "what a 'prompt' is in this AI outreach tool and how to write a good one — what to specify (tone, length, angle, what to include or avoid) so the generated message sounds personal and not salesy",
  });
  return result.text;
}
