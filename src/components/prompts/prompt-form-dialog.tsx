"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createPrompt,
  explainPrompt,
  updatePrompt,
  type Prompt,
} from "@/lib/prompt-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface PromptFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt?: Prompt | null;
}

export function PromptFormDialog({
  open,
  onOpenChange,
  prompt,
}: PromptFormDialogProps) {
  const router = useRouter();
  const isEdit = Boolean(prompt);

  const [name, setName] = useState(prompt?.name ?? "");
  const [systemPrompt, setSystemPrompt] = useState(prompt?.systemPrompt ?? "");
  const [isDefault, setIsDefault] = useState(prompt?.isDefault ?? false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);

  async function onExplain() {
    if (explanation) {
      setExplanation(null);
      return;
    }
    setExplaining(true);
    try {
      setExplanation(await explainPrompt());
    } catch {
      setExplanation("Couldn't load an explanation right now.");
    } finally {
      setExplaining(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = { name, systemPrompt, isDefault };
      if (prompt) {
        await updatePrompt(prompt.id, payload);
      } else {
        await createPrompt(payload);
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit prompt" : "New prompt"}</DialogTitle>
          <DialogDescription>
            Your instructions for how the message should be written — tone,
            length, and angle.
          </DialogDescription>
          <button
            type="button"
            onClick={onExplain}
            disabled={explaining}
            className="w-fit text-left text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:opacity-60"
          >
            {explaining
              ? "Thinking..."
              : explanation
                ? "Hide explanation"
                : "What is a prompt, and how do I write a good one?"}
          </button>
          {explanation && (
            <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              {explanation}
            </p>
          )}
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Casual founder"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="systemPrompt">System prompt</Label>
            <Textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Write a short, warm outreach message. Reference one specific detail..."
              rows={8}
              className="max-h-72 overflow-y-auto"
              required
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="grid gap-0.5">
              <Label htmlFor="isDefault">Default prompt</Label>
              <span className="text-xs text-muted-foreground">
                Used automatically when generating messages.
              </span>
            </div>
            <Switch
              id="isDefault"
              checked={isDefault}
              onCheckedChange={setIsDefault}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
