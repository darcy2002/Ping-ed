import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAnalytics } from "@/lib/analytics-actions";
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

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            A live snapshot of your outreach activity.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="gap-1">
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {stat.value}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{stat.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Offering usage</CardTitle>
            <CardDescription>Conversations started per offering.</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.offeringUsage.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No offerings yet.
              </p>
            ) : (
              <ul className="flex flex-col divide-y">
                {analytics.offeringUsage.map((o) => (
                  <li
                    key={o.offeringId}
                    className="flex items-center justify-between py-2.5 text-sm"
                  >
                    <span className="truncate pr-3">{o.name}</span>
                    <span className="shrink-0 font-medium tabular-nums">
                      {o.conversations}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
