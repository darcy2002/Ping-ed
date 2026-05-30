import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listOfferings } from "@/lib/offering-actions";
import { listPrompts } from "@/lib/prompt-actions";
import { listProspects } from "@/lib/prospect-actions";
import { GenerateForm } from "@/components/generate/generate-form";

export default async function GeneratePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const [offerings, prompts, prospects] = await Promise.all([
    listOfferings(),
    listPrompts(),
    listProspects(),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <GenerateForm
        offerings={offerings.map((o) => ({ id: o.id, name: o.name }))}
        prompts={prompts.map((p) => ({
          id: p.id,
          name: p.name,
          isDefault: p.isDefault,
        }))}
        prospects={prospects.map((p) => ({ id: p.id, name: p.name }))}
      />
    </main>
  );
}
