import { and, count, countDistinct, desc, eq } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversation, message, offering, prospect } from "@/lib/schema";

export interface OfferingUsage {
  offeringId: string;
  name: string;
  conversations: number;
}

export interface Analytics {
  totalOutreach: number;
  prospectsSaved: number;
  conversationsWithReply: number;
  offeringUsage: OfferingUsage[];
}

// All metrics are derived live from count queries scoped to the user — there
// is no analytics table to keep in sync.
export async function getAnalytics(): Promise<Analytics> {
  const userId = await getSessionUserId();

  const [outreachRow] = await db
    .select({ value: count() })
    .from(message)
    .innerJoin(conversation, eq(message.conversationId, conversation.id))
    .where(
      and(eq(conversation.userId, userId), eq(message.role, "outreach")),
    );

  const [prospectsRow] = await db
    .select({ value: count() })
    .from(prospect)
    .where(eq(prospect.userId, userId));

  const [repliesRow] = await db
    .select({ value: countDistinct(conversation.id) })
    .from(conversation)
    .innerJoin(message, eq(message.conversationId, conversation.id))
    .where(
      and(
        eq(conversation.userId, userId),
        eq(message.role, "prospect_reply"),
      ),
    );

  // Left join so offerings with zero conversations still show up at 0.
  const offeringUsage = await db
    .select({
      offeringId: offering.id,
      name: offering.name,
      conversations: count(conversation.id),
    })
    .from(offering)
    .leftJoin(conversation, eq(conversation.offeringId, offering.id))
    .where(eq(offering.userId, userId))
    .groupBy(offering.id, offering.name)
    .orderBy(desc(count(conversation.id)));

  return {
    totalOutreach: outreachRow?.value ?? 0,
    prospectsSaved: prospectsRow?.value ?? 0,
    conversationsWithReply: repliesRow?.value ?? 0,
    offeringUsage,
  };
}
