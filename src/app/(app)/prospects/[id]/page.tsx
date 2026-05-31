import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProspect } from "@/lib/prospect-actions";
import { getProspectConversations } from "@/lib/conversation-actions";
import { ProspectDetail } from "@/components/prospects/prospect-detail";

export default async function ProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const { id } = await params;

  let prospect;
  try {
    prospect = await getProspect(id);
  } catch {
    notFound();
  }

  const conversations = await getProspectConversations(id);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <ProspectDetail prospect={prospect} conversations={conversations} />
    </main>
  );
}
