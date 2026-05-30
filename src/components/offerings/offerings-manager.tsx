"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Layers, Link as LinkIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteOffering, type Offering } from "@/lib/offering-actions";
import { PageHeader } from "@/components/page-header";
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
      <PageHeader
        title="Offerings"
        subtitle="What you're pitching. Reused across every generated message."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" /> New offering
          </Button>
        }
      />

      {offerings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
              <Layers className="size-5" />
            </div>
            <div className="text-sm font-medium">No offerings yet</div>
            <p className="max-w-sm text-sm text-muted-foreground">
              Create your first one to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offerings.map((offering) => (
            <Card key={offering.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="min-w-0 leading-snug">
                    {offering.name}
                  </CardTitle>
                  <Layers className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                </div>
                {offering.sourceUrl ? (
                  <CardDescription className="flex items-center gap-1.5 truncate">
                    <LinkIcon className="size-3 shrink-0" />
                    <a
                      href={offering.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate underline"
                    >
                      {offering.sourceUrl.replace(/^https?:\/\//, "")}
                    </a>
                  </CardDescription>
                ) : (
                  <CardDescription className="opacity-70">
                    Pasted content
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                {offering.content && (
                  <p className="line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
                    {offering.content}
                  </p>
                )}
              </CardContent>
              <CardFooter className="justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(offering)}
                >
                  <Pencil className="size-3.5" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete"
                  onClick={() => setDeleting(offering)}
                >
                  <Trash2 className="size-4" />
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
