"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createOffering,
  updateOffering,
  type Offering,
} from "@/lib/offering-actions";
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
import { Textarea } from "@/components/ui/textarea";

interface OfferingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offering?: Offering | null;
}

export function OfferingFormDialog({
  open,
  onOpenChange,
  offering,
}: OfferingFormDialogProps) {
  const router = useRouter();
  const isEdit = Boolean(offering);

  const [name, setName] = useState(offering?.name ?? "");
  const [sourceUrl, setSourceUrl] = useState(offering?.sourceUrl ?? "");
  const [content, setContent] = useState(offering?.content ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        name,
        sourceUrl: sourceUrl.trim() === "" ? null : sourceUrl.trim(),
        content,
      };
      if (offering) {
        await updateOffering(offering.id, payload);
      } else {
        await createOffering(payload);
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit offering" : "New offering"}</DialogTitle>
          <DialogDescription>
            Describe what you&apos;re offering. This context feeds every
            generated message.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pinged outreach tool"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sourceUrl">Source URL (optional)</Label>
            <Input
              id="sourceUrl"
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What it is, who it's for, the value it delivers..."
              rows={8}
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
