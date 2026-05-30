"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteOffering, type Offering } from "@/lib/offering-actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OfferingFormDialog } from "@/components/offerings/offering-form-dialog";

export function OfferingsManager({ offerings }: { offerings: Offering[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Offering | null>(null);
  const [deleting, setDeleting] = useState<Offering | null>(null);
  const [removing, setRemoving] = useState(false);

  async function confirmDelete() {
    if (!deleting) return;
    setRemoving(true);
    try {
      await deleteOffering(deleting.id);
      setDeleting(null);
      router.refresh();
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Offerings</h1>
          <p className="text-sm text-muted-foreground">
            What you&apos;re pitching. Reused across every generated message.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>New offering</Button>
      </div>

      {offerings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No offerings yet. Create your first one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {offerings.map((offering) => (
            <Card key={offering.id}>
              <CardHeader>
                <CardTitle>{offering.name}</CardTitle>
                {offering.sourceUrl && (
                  <CardDescription className="truncate">
                    <a
                      href={offering.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      {offering.sourceUrl}
                    </a>
                  </CardDescription>
                )}
              </CardHeader>
              {offering.content && (
                <CardContent>
                  <p className="line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
                    {offering.content}
                  </p>
                </CardContent>
              )}
              <CardFooter className="justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(offering)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleting(offering)}
                >
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {creating && (
        <OfferingFormDialog
          key="create"
          open={creating}
          onOpenChange={setCreating}
        />
      )}

      {editing && (
        <OfferingFormDialog
          key={editing.id}
          open={Boolean(editing)}
          onOpenChange={(open) => !open && setEditing(null)}
          offering={editing}
        />
      )}

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete offering?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes &ldquo;{deleting?.name}&rdquo;. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={removing}
            >
              {removing ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
