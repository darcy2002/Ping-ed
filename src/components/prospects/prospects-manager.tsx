"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteProspect, type Prospect } from "@/lib/prospect-actions";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Prospects</h1>
          <p className="text-sm text-muted-foreground">
            People you&apos;re reaching out to and the sources you&apos;ve saved
            on them.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>New prospect</Button>
      </div>

      {prospects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No prospects yet. Create your first one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {prospects.map((prospect) => (
            <Card key={prospect.id}>
              <CardHeader>
                <CardTitle>{prospect.name}</CardTitle>
              </CardHeader>
              <CardFooter className="justify-end gap-2">
                <Button asChild variant="default" size="sm">
                  <Link href={`/prospects/${prospect.id}`}>Manage sources</Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(prospect)}
                >
                  Rename
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleting(prospect)}
                >
                  Delete
                </Button>
              </CardFooter>
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
              This permanently deletes &ldquo;{deleting?.name}&rdquo; and all its
              sources. This cannot be undone.
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
