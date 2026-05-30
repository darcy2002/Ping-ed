import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ChevronRight,
  FileText,
  Layers,
  MessageSquare,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getAnalytics } from "@/lib/analytics-actions";
import { listOfferings } from "@/lib/offering-actions";
import { listPrompts } from "@/lib/prompt-actions";
import { listProspects } from "@/lib/prospect-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const [analytics, offerings, prompts, prospects] = await Promise.all([
    getAnalytics(),
    listOfferings(),
    listPrompts(),
    listProspects(),
  ]);

  const first = (session.user.name || session.user.email).split(" ")[0];
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const stats = [
    {
      label: "Outreach sent",
      value: analytics.totalOutreach,
      Icon: Send,
      href: "/analytics",
    },
    {
      label: "Prospects",
      value: analytics.prospectsSaved,
      Icon: Users,
      href: "/prospects",
    },
    {
      label: "Replies",
      value: analytics.conversationsWithReply,
      Icon: MessageSquare,
      href: "/analytics",
    },
  ];

  const links = [
    {
      label: "Offerings",
      count: offerings.length,
      Icon: Layers,
      href: "/offerings",
    },
    {
      label: "Prompts",
      count: prompts.length,
      Icon: FileText,
      href: "/prompts",
    },
    {
      label: "Prospects",
      count: prospects.length,
      Icon: Users,
      href: "/prospects",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting}, {first}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s what&apos;s moving in your outreach today.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map(({ label, value, Icon, href }) => (
            <Link key={label} href={href}>
              <Card className="h-full transition-colors hover:bg-accent/40">
                <CardContent className="flex flex-col gap-2.5 py-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      {label}
                    </span>
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <span className="text-3xl font-semibold tracking-tight tabular-nums">
                    {value}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <Card className="overflow-hidden p-0">
            <div className="flex items-center gap-3 border-b p-5">
              <div className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-primary text-primary-foreground">
                <Sparkles className="size-5" />
              </div>
              <div>
                <div className="font-semibold">Quick generate</div>
                <div className="text-sm text-muted-foreground">
                  Pick three inputs and write a message.
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-muted-foreground">
                Choose an offering, a prompt, and a prospect — Pinged assembles
                the context and writes the message in your voice.
              </p>
              <Button asChild className="mt-4">
                <Link href="/generate">
                  <Sparkles className="size-4" /> Open Generate
                </Link>
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your workspace</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col">
              {links.map(({ label, count, Icon, href }, i) => (
                <Link
                  key={label}
                  href={href}
                  className={`flex items-center gap-3 py-2.5 ${i ? "border-t" : ""}`}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="size-4" />
                  </span>
                  <span className="flex-1 text-sm font-medium">{label}</span>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {count}
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
