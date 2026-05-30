"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import {
  deletePrompt,
  setDefaultPrompt,
  type Prompt,
} from "@/lib/prompt-actions";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PromptFormDialog } from "@/components/prompts/prompt-form-dialog";

export function PromptsManager({ prompts }: { prompts: Prompt[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Prompt | null>(null);
  const [deleting, setDeleting] = useState<Prompt | null>(null);
  const [removing, setRemoving] = useState(false);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);

  async function confirmDelete() {
    if (!deleting) return;
    setRemoving(true);
    try {
      await deletePrompt(deleting.id);
      setDeleting(null);
      router.refresh();
    } finally {
      setRemoving(false);
    }
  }

  async function onSetDefault(id: string) {
    setSettingDefault(id);
    try {
      await setDefaultPrompt(id);
      router.refresh();
    } finally {
      setSettingDefault(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Prompts"
        subtitle="How messages get written. The default is used when you generate."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" /> New prompt
          </Button>
        }
      />

      {prompts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
              <FileText className="size-5" />
            </div>
            <div className="text-sm font-medium">No prompts yet</div>
            <p className="max-w-sm text-sm text-muted-foreground">
              Create your first one to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {prompts.map((prompt) => (
            <Card key={prompt.id}>
              <div className="flex items-start gap-4 p-5">
                <div className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-muted text-muted-foreground">
                  <FileText className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-semibold">{prompt.name}</span>
                    {prompt.isDefault && <Badge>Default</Badge>}
                  </div>
                  <p className="line-clamp-2 whitespace-pre-wrap text-sm text-muted-foreground">
                    {prompt.systemPrompt}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!prompt.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSetDefault(prompt.id)}
                      disabled={settingDefault === prompt.id}
                    >
                      {settingDefault === prompt.id
                        ? "Setting..."
                        : "Set default"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(prompt)}
                  >
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete"
                    onClick={() => setDeleting(prompt)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {creating && (
        <PromptFormDialog
          key="create"
          open={creating}
          onOpenChange={setCreating}
        />
      )}

      {editing && (
        <PromptFormDialog
          key={editing.id}
          open={Boolean(editing)}
          onOpenChange={(open) => !open && setEditing(null)}
          prompt={editing}
        />
      )}

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete prompt?</AlertDialogTitle>
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
