import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAnalytics } from "@/lib/analytics-actions";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AnalyticsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const analytics = await getAnalytics();

  const stats = [
    {
      label: "Outreach messages",
      value: analytics.totalOutreach,
      hint: "Total messages generated",
    },
    {
      label: "Prospects saved",
      value: analytics.prospectsSaved,
      hint: "People you're reaching out to",
    },
    {
      label: "Replies received",
      value: analytics.conversationsWithReply,
      hint: "Conversations with ≥1 reply",
    },
  ];

  const maxUsage = Math.max(
    1,
    ...analytics.offeringUsage.map((o) => o.conversations),
  );

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Analytics"
          subtitle="A live snapshot of your outreach activity."
        />

        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex flex-col gap-1.5 py-5">
                <span className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </span>
                <span className="text-4xl font-semibold tracking-tight tabular-nums">
                  {stat.value}
                </span>
                <span className="text-xs text-muted-foreground">
                  {stat.hint}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Offering usage</CardTitle>
            <CardDescription>
              Conversations started per offering.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.offeringUsage.length === 0 ? (
              <p className="text-sm text-muted-foreground">No offerings yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {analytics.offeringUsage.map((o) => (
                  <div key={o.offeringId} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate pr-3">{o.name}</span>
                      <span className="shrink-0 font-medium tabular-nums">
                        {o.conversations}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${(o.conversations / maxUsage) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
