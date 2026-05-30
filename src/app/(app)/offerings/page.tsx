import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listOfferings } from "@/lib/offering-actions";
import { OfferingsManager } from "@/components/offerings/offerings-manager";

export default async function OfferingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const offerings = await listOfferings();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <OfferingsManager offerings={offerings} />
    </main>
  );
}
