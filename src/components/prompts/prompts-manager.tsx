"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  deletePrompt,
  setDefaultPrompt,
  type Prompt,
} from "@/lib/prompt-actions";
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
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Prompts</h1>
          <p className="text-sm text-muted-foreground">
            How messages get written. The default is used when you generate.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>New prompt</Button>
      </div>

      {prompts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No prompts yet. Create your first one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {prompts.map((prompt) => (
            <Card key={prompt.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {prompt.name}
                  {prompt.isDefault && <Badge variant="secondary">Default</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
                  {prompt.systemPrompt}
                </p>
              </CardContent>
              <CardFooter className="justify-end gap-2">
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
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleting(prompt)}
                >
                  Delete
                </Button>
              </CardFooter>
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
