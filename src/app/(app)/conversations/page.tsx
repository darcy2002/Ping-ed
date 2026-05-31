import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { getConversationsByProspect } from "@/lib/conversation-actions";
import { Monogram } from "@/components/brand";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ProspectConversations } from "@/components/prospects/prospect-conversations";

export default async function ConversationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const groups = await getConversationsByProspect();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Conversations"
          subtitle="Every message you've generated, grouped by prospect."
        />

        {groups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No conversations yet. Generate a message for a prospect to start
              one.
            </CardContent>
          </Card>
        ) : (
          groups.map((g) => (
            <div key={g.prospectId} className="flex flex-col gap-3">
              <Link
                href={`/prospects/${g.prospectId}`}
                className="flex w-fit items-center gap-2.5 text-foreground"
              >
                <Monogram name={g.prospectName} size={32} />
                <span className="font-semibold">{g.prospectName}</span>
                <span className="text-xs text-muted-foreground">
                  {g.conversations.length} conversation
                  {g.conversations.length === 1 ? "" : "s"}
                </span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
              <ProspectConversations
                conversations={g.conversations}
                showHeading={false}
              />
            </div>
          ))
        )}
      </div>
    </main>
  );
}
