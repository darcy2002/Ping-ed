import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        Pinged
      </h1>
      <p className="max-w-md text-lg text-muted-foreground">
        Hyper-personalized AI outreach. Define your offering, save a prospect,
        and generate a message that actually lands.
      </p>
      <Button asChild size="lg">
        <Link href="/sign-up">Get started</Link>
      </Button>
    </main>
  );
}
