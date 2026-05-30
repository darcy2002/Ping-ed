"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    await signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={onClick} disabled={loading}>
      {loading ? "Signing out..." : "Sign out"}
    </Button>
  );
}
