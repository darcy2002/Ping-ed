"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronRight, Pencil, Plus, Trash2, Users } from "lucide-react";
import { deleteProspect, type Prospect } from "@/lib/prospect-actions";
import { Monogram } from "@/components/brand";
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
import { Card, CardContent } from "@/components/ui/card";
import { ProspectFormDialog } from "@/components/prospects/prospect-form-dialog";

export function ProspectsManager({ prospects }: { prospects: Prospect[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Prospect | null>(null);
  const [deleting, setDeleting] = useState<Prospect | null>(null);
  const [removing, setRemoving] = useState(false);

  async function confirmDelete() {
    if (!deleting) return;
    setRemoving(true);
    try {
      await deleteProspect(deleting.id);
      setDeleting(null);
      router.refresh();
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Prospects"
        subtitle="People you're reaching out to and the sources you've saved on them."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" /> New prospect
          </Button>
        }
      />

      {prospects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
              <Users className="size-5" />
            </div>
            <div className="text-sm font-medium">No prospects yet</div>
            <p className="max-w-sm text-sm text-muted-foreground">
              Create your first one to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {prospects.map((prospect) => (
            <Card key={prospect.id} className="flex flex-col gap-0 p-0">
              <Link
                href={`/prospects/${prospect.id}`}
                className="flex items-center gap-3 p-5 transition-colors hover:bg-accent/40"
              >
                <Monogram name={prospect.name} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{prospect.name}</div>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
              <div className="flex items-center justify-end gap-2 border-t px-4 py-2.5">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/prospects/${prospect.id}`}>Manage sources</Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(prospect)}
                >
                  <Pencil className="size-3.5" /> Rename
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete"
                  onClick={() => setDeleting(prospect)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {creating && (
        <ProspectFormDialog
          key="create"
          open={creating}
          onOpenChange={setCreating}
        />
      )}

      {editing && (
        <ProspectFormDialog
          key={editing.id}
          open={Boolean(editing)}
          onOpenChange={(open) => !open && setEditing(null)}
          prospect={editing}
        />
      )}

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete prospect?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes &ldquo;{deleting?.name}&rdquo; and all
              its sources. This cannot be undone.
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
