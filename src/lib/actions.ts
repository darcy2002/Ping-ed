"use server";

import { and, eq } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { prospect, prospectSource } from "@/lib/schema";
import { fetchMarkdown } from "@/lib/jina";
import { enrichSource, extractFromScreenshot } from "@/ai/tasks";

const URL_SOURCE_TYPES = new Set([
  "github_url",
  "website_url",
  "company_url",
  "other_url",
]);

export async function enrichProspectSource(sourceId: string): Promise<void> {
  const userId = await getSessionUserId();

  const rows = await db
    .select({
      id: prospectSource.id,
      type: prospectSource.type,
      value: prospectSource.value,
    })
    .from(prospectSource)
    .innerJoin(prospect, eq(prospectSource.prospectId, prospect.id))
    .where(
      and(eq(prospectSource.id, sourceId), eq(prospect.userId, userId)),
    );

  const source = rows[0];
  if (!source) throw new Error("Source not found");

  try {
    let extractedContext: string;

    if (source.type === "linkedin_screenshot") {
      // value is a data URL: "data:<mediaType>;base64,<data>"
      const match = source.value.match(/^data:([^;]+);base64,(.+)$/s);
      if (!match) throw new Error("Invalid screenshot data URL");
      const result = await extractFromScreenshot({
        mediaType: match[1],
        dataBase64: match[2],
      });
      extractedContext = result.text;
    } else if (source.type === "freetext") {
      const result = await enrichSource({ type: "freetext", content: source.value });
      extractedContext = result.text;
    } else if (URL_SOURCE_TYPES.has(source.type)) {
      const markdown = await fetchMarkdown(source.value);
      const result = await enrichSource({ type: source.type, content: markdown });
      extractedContext = result.text;
    } else {
      throw new Error(`Unknown source type: ${source.type}`);
    }

    await db
      .update(prospectSource)
      .set({ extractedContext, status: "enriched", updatedAt: new Date() })
      .where(eq(prospectSource.id, sourceId));
  } catch (err) {
    await db
      .update(prospectSource)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(prospectSource.id, sourceId));
    throw err;
  }
}
