import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listProspects } from "@/lib/prospect-actions";
import { ProspectsManager } from "@/components/prospects/prospects-manager";

export default async function ProspectsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const prospects = await listProspects();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <ProspectsManager prospects={prospects} />
    </main>
  );
}
