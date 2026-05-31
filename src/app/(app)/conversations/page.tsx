import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getConversationsByProspect } from "@/lib/conversation-actions";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ConversationGroup } from "@/components/conversations/conversation-group";

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
          groups.map((g) => <ConversationGroup key={g.prospectId} group={g} />)
        )}
      </div>
    </main>
  );
}
