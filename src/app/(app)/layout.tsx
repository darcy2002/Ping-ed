import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { TopNav } from "@/components/app-shell/top-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = {
    name: session.user.name || session.user.email,
    email: session.user.email,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav user={user} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
