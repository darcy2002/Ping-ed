import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listPrompts, seedStarterPrompts } from "@/lib/prompt-actions";
import { PromptsManager } from "@/components/prompts/prompts-manager";

export default async function PromptsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  await seedStarterPrompts();
  const prompts = await listPrompts();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <PromptsManager prompts={prompts} />
    </main>
  );
}
